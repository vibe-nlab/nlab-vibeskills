"""Гейт: выполняет ли трейс контракт мониторинга v1.

Берёт готовый трейс с сервера MLflow и говорит, что из контракта в нём есть,
чего нет и чем это обернётся во внешнем вьюере. Проверяется РЕЗУЛЬТАТ (трейс на
сервере), а не код: единственный способ узнать, что инструментация действительно
доехала, — прочитать то, что доехало.

    python check_contract.py                 # последний трейс эксперимента
    python check_contract.py tr-<id>         # конкретный трейс
    python check_contract.py --experiment my-project

Адрес сервера — из `MLFLOW_TRACKING_URI`, эксперимент — из `MLFLOW_EXPERIMENT`
(или `--experiment`). Ненулевой код возврата = нарушено ОБЯЗАТЕЛЬНОЕ.

Контракт v1 (подробности — в SKILL.md скилла observability):

| Что                       | Где        | Зачем                                      |
|---------------------------|------------|--------------------------------------------|
| `span_type=CHAIN` + вход/выход | корень | превью запуска в списке, точка входа дерева |
| `span_type=AGENT`         | спан шага  | по типу вьюер находит шаги                  |
| `nlab.step.id`            | спан шага  | стабильный ключ: имя шага меняется, id — нет|
| `nlab.step.title`         | спан шага  | подпись «что делает шаг»                    |
| `nlab.step.after`         | спан шага  | единственный источник стрелок; нет — стрелок нет |
| `nlab.schema`             | трейс      | версия контракта                            |
| `nlab.mode`               | трейс      | диалект вложенных спанов библиотеки         |
| `nlab.service`            | трейс      | имя сервиса                                 |

Требуется: `mlflow>=3` (и `python-dotenv`, если переменные лежат в `.env`).
"""

from __future__ import annotations

import json
import os
import sys

import mlflow

# Значение спана тяжелее этого порога без пометки `nlab.truncated` — повод
# ругнуться: такие спаны раздувают трейс (у флейвора pydantic-ai один
# `execute_tool_call` весил 250+ КБ — 69% трейса).
HEAVY_VALUE_CHARS = 100_000


# --- чтение трейса -----------------------------------------------------------


def as_dict(trace) -> dict:
    """Трейс в чистый JSON: у SDK и REST разные объекты, дальше работаем с dict."""
    return json.loads(trace.to_json())


def attrs(span: dict) -> dict:
    """Атрибуты спана. В JSON они лежат строками-JSON — разворачиваем."""
    out = {}
    for key, raw in (span.get("attributes") or {}).items():
        try:
            out[key] = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            out[key] = raw
    return out


def span_type(span: dict) -> str:
    return attrs(span).get("mlflow.spanType", "UNKNOWN")


def trace_marks(info: dict, spans: list[dict]) -> dict:
    """Метки контракта уровня трейса.

    Ищутся в трёх местах, потому что шаблон ставит их и тегами трейса, и
    атрибутами спанов: тег удобнее для фильтрации списка, атрибут доезжает
    вместе со спаном (в реалтайме теги трейса могут ещё не приехать).
    """
    marks = {}
    for source in (info.get("tags") or {}, info.get("trace_metadata") or {}):
        for key, value in source.items():
            if key.startswith("nlab."):
                marks.setdefault(key, value)
    for span in spans:
        for key, value in attrs(span).items():
            if key.startswith("nlab.") and not key.startswith("nlab.step."):
                marks.setdefault(key, value)
    return marks


# --- отчёт -------------------------------------------------------------------


class Report:
    """Строки отчёта. `must` — нарушение блокирует, `should` — предупреждает."""

    def __init__(self) -> None:
        self.lines: list[tuple[str, bool, str]] = []
        self.broken = 0

    def must(self, ok: bool, text: str) -> None:
        self.lines.append(("ОБЯЗАТЕЛЬНОЕ", ok, text))
        if not ok:
            self.broken += 1

    def should(self, ok: bool, text: str) -> None:
        self.lines.append(("РЕКОМЕНДУЕМОЕ", ok, text))

    def print(self) -> None:
        for section in ("ОБЯЗАТЕЛЬНОЕ", "РЕКОМЕНДУЕМОЕ"):
            rows = [(ok, text) for s, ok, text in self.lines if s == section]
            if not rows:
                continue
            print(f"\n{section}")
            for ok, text in rows:
                print(f"  {'[ок] ' if ok else '[НЕТ]'} {text}")


def check(trace) -> Report:
    data = as_dict(trace)
    info, spans = data["info"], data["data"]["spans"]
    marks = trace_marks(info, spans)
    rep = Report()

    state = info.get("state", "?")
    print(f"трейс {info['trace_id']}  state={state}  спанов: {len(spans)}")

    # --- метки уровня трейса
    rep.must(marks.get("nlab.schema") is not None,
             f"nlab.schema — версия контракта: {marks.get('nlab.schema', 'НЕТ')}"
             + ("" if marks.get("nlab.schema") else
                " → вьюер не знает, по какой версии разбирать трейс"))
    rep.must(bool(marks.get("nlab.mode")),
             f"nlab.mode — режим включения трейсинга: {marks.get('nlab.mode', 'НЕТ')}"
             + ("" if marks.get("nlab.mode") else
                " → вьюер не знает диалект вложенных спанов (Agent.run у флейвора "
                "против invoke_agent у моста OTel) и разберёт их неверно"))
    rep.must(bool(marks.get("nlab.service")),
             f"nlab.service — имя сервиса: {marks.get('nlab.service', 'НЕТ')}")

    # --- корень
    roots = [s for s in spans if not s.get("parent_span_id")]
    root = roots[0] if roots else None
    if root is None:
        rep.must(False, "корневого спана нет"
                 + (" — трейс ещё идёт, это нормально: корень закрывается последним"
                    if state == "IN_PROGRESS" else
                    " → у запуска нет точки входа, дерево рассыпано"))
    else:
        rtype = span_type(root)
        rep.must(rtype == "CHAIN",
                 f"корень {root['name']}: span_type={rtype}"
                 + ("" if rtype == "CHAIN" else " (ожидался CHAIN)"))
        ra = attrs(root)
        rep.must(bool(ra.get("mlflow.spanInputs")) and bool(ra.get("mlflow.spanOutputs")),
                 "вход и выход корня заполнены"
                 if ra.get("mlflow.spanInputs") and ra.get("mlflow.spanOutputs")
                 else "вход/выход корня пусты → в списке трейсов строка без превью, "
                      "по чему был запуск и чем кончился — не видно")

    # --- шаги
    steps = [s for s in spans if span_type(s) == "AGENT"]
    named = [s for s in spans if s is not root and span_type(s) not in ("AGENT", "LLM",
                                                                       "TOOL", "CHAT_MODEL")]
    rep.must(bool(steps),
             f"шаги: {len(steps)} спанов со span_type=AGENT"
             if steps else
             f"шагов со span_type=AGENT: 0 (спанов другого типа: {len(named)}) "
             "→ вьюер не найдёт шаги и покажет пустую схему")

    # Поля шагов проверяются, только если шаги вообще нашлись: иначе «0 из 0»
    # выдаёт за отдельные нарушения то же самое отсутствие шагов.
    if steps:
        with_id = [s for s in steps if "nlab.step.id" in attrs(s)]
        rep.must(len(with_id) == len(steps),
                 f"nlab.step.id: {len(with_id)} из {len(steps)} шагов"
                 + ("" if len(with_id) == len(steps) else
                    " → шаг не с чем связать: имя спана поменяется, и ссылки протухнут"))

        with_title = [s for s in steps if attrs(s).get("nlab.step.title")]
        rep.should(len(with_title) == len(steps),
                   f"nlab.step.title: {len(with_title)} из {len(steps)} шагов"
                   + ("" if len(with_title) == len(steps) else
                      " → карточки шагов будут без подписи «что делает шаг»"))

        # У первого шага предшественников нет по определению, поэтому норма —
        # «все, кроме одного», а не «все».
        with_after = [s for s in steps if attrs(s).get("nlab.step.after")]
        rep.should(len(with_after) >= len(steps) - 1,
                   f"nlab.step.after: {len(with_after)} из {len(steps)} шагов"
                   + ("" if len(with_after) >= len(steps) - 1 else
                      f" (не проставлен у {len(steps) - len(with_after)}) → вьюер обязан "
                      "нарисовать эти шаги БЕЗ стрелок: догадка по времени или по номерам "
                      "в имени даёт не приближение, а другой граф"))

    session = (info.get("trace_metadata") or {}).get("mlflow.trace.session", "")
    rep.should(bool(session),
               f"сессия: {session}" if session else
               "сессия не проставлена → запуски одного диалога не сгруппировать")

    heavy = []
    for s in spans:
        a = attrs(s)
        if a.get("nlab.truncated"):
            continue
        size = max((len(json.dumps(a.get(k, ""), ensure_ascii=False))
                    for k in ("mlflow.spanInputs", "mlflow.spanOutputs")), default=0)
        if size > HEAVY_VALUE_CHARS:
            heavy.append((s["name"], size))
    rep.should(not heavy,
               "тяжёлых спанов нет" if not heavy else
               "тяжёлые спаны без пометки nlab.truncated: "
               + ", ".join(f"{n} ({sz // 1024} КБ)" for n, sz in heavy[:5])
               + " → трейс раздут, вьюер тянет мегабайты ради нескольких строк")

    usage = (info.get("trace_metadata") or {}).get("mlflow.trace.tokenUsage")
    rep.should(bool(usage),
               f"токены посчитаны MLflow: {usage}" if usage else
               "MLflow не посчитал токены — либо LLM-спанов нет, либо "
               "инструментация модели не включилась (руками их дублировать не надо)")
    return rep


# --- запуск ------------------------------------------------------------------


def main() -> int:
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except ImportError:
        pass

    args = [a for a in sys.argv[1:]]
    experiment = os.getenv("MLFLOW_EXPERIMENT", "")
    if "--experiment" in args:
        i = args.index("--experiment")
        experiment = args[i + 1]
        del args[i:i + 2]
    trace_id = args[0] if args else ""

    uri = os.getenv("MLFLOW_TRACKING_URI", "").strip()
    if not uri:
        print("MLFLOW_TRACKING_URI пуст — проверять нечего: трейсы никуда не пишутся")
        return 2
    mlflow.set_tracking_uri(uri)

    if not trace_id:
        if not experiment:
            print("не задан ни trace_id, ни эксперимент (MLFLOW_EXPERIMENT/--experiment)")
            return 2
        exp = mlflow.get_experiment_by_name(experiment)
        if exp is None:
            print(f"эксперимент {experiment!r} не найден на {uri}")
            return 2
        found = mlflow.search_traces(locations=[exp.experiment_id], max_results=1,
                                     order_by=["timestamp_ms DESC"], return_type="list")
        if not found:
            print(f"в эксперименте {experiment!r} нет трейсов")
            return 2
        trace_id = found[0].info.trace_id

    rep = check(mlflow.get_trace(trace_id))
    rep.print()
    print("\nИТОГ")
    if rep.broken:
        print(f"  нарушено обязательного: {rep.broken} → трейс не разбирается "
              "внешним вьюером по контракту v1")
        return 1
    print("  контракт мониторинга v1 выполнен")
    return 0


if __name__ == "__main__":
    sys.exit(main())
