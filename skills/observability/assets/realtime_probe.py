"""Замер: когда трейс и его спаны становятся видны на сервере MLflow.

Отвечает на вопрос «трейсинг реально идёт по ходу запуска или собирается в
конце?» — фактом, а не рассуждением. Скрипт запускает работу и ПАРАЛЛЕЛЬНО
опрашивает REST-API сервера раз в секунду:

- `POST /api/3.0/mlflow/traces/search`   — появился ли трейс и в каком он `state`;
- `GET  /api/3.0/mlflow/traces/batchGet` — сколько спанов у него уже на сервере.

На выходе — таблица «шаг закрылся локально на N-й секунде → стал виден снаружи
на M-й»: разница и есть отставание доставки.

    python realtime_probe.py            # автономно: спаны-заглушки со сном, LLM не нужен
    python realtime_probe.py --real     # прогон своего конвейера (см. run_real ниже)

Ожидаемая картина на исправной связке (mlflow ≥ 3.15 клиент, сервер ≥ 3.4):
трейс виден со `state=IN_PROGRESS` ДО конца запуска, шаги приезжают по одному с
отставанием ~0.6 с (с настройками из assets/tracing.py) или 1.4–2.2 с (с
дефолтами MLflow). Всё появилось разом в конце → сервер старше 3.4: он не умеет
инкрементальный `log_spans`, и клиент молча откатывается на «трейс целиком».

Имена спанов и ключи `inputs`/`outputs` здесь латиницей и в snake_case — по
тому же правилу, что и в шаблоне `tracing.py`: это имена полей, по которым
ищут и сравнивают шаги в UI. Замерялка лежит в комплекте скилла, поэтому
служит и образцом.

Требуется: `requests` (тянется вместе с mlflow), `python-dotenv`.
Нужен ИМЕННО HTTP-сервер MLflow: локальное файловое хранилище (`./mlruns`,
`sqlite:///…`) опрашивать нечем — замер на нём бессмысленен.
"""

from __future__ import annotations

import asyncio
import os
import sys
import threading
import time

import requests
from dotenv import load_dotenv

POLL_INTERVAL = 1.0
T0 = time.monotonic()


def el() -> float:
    """Секунд от старта замера."""
    return round(time.monotonic() - T0, 1)


# --- поллинг сервера ---------------------------------------------------------


class Poller(threading.Thread):
    """Фоновый опрос сервера: что он знает о трейсе прямо сейчас."""

    def __init__(self, base: str, experiment_id: str, known_before: set[str]):
        super().__init__(daemon=True)
        self.base = base.rstrip("/")
        self.experiment_id = experiment_id
        self.known_before = known_before
        self.stop_flag = threading.Event()
        self.trace_id: str | None = None
        self.trace_seen_at: float | None = None
        # Ключ — span_id, а не имя: имена шагов повторяются (цикл по документам,
        # ретрай одного и того же шага), и по имени второй спан потерялся бы.
        self.span_seen_at: dict[str, float] = {}   # span_id -> секунда прихода
        self.span_names: dict[str, str] = {}       # span_id -> имя спана
        self.samples: list[tuple[float, int, str]] = []  # (секунда, спанов, state)

    def arrivals(self, name: str) -> list[float]:
        """Секунды прихода всех спанов с этим именем, по порядку."""
        return sorted(
            at for sid, at in self.span_seen_at.items() if self.span_names.get(sid) == name
        )

    def run(self) -> None:
        while not self.stop_flag.is_set():
            try:
                self.tick()
            except Exception as exc:  # noqa: BLE001 — замер не должен ронять прогон
                print(f"[{el():>5}] ошибка опроса: {exc}")
            self.stop_flag.wait(POLL_INTERVAL)

    def tick(self) -> None:
        if self.trace_id is None:
            resp = requests.post(
                f"{self.base}/api/3.0/mlflow/traces/search",
                json={
                    "locations": [
                        {"mlflow_experiment": {"experiment_id": self.experiment_id}}
                    ],
                    "max_results": 5,
                },
                timeout=10,
            )
            for tr in resp.json().get("traces", []):
                if tr["trace_id"] not in self.known_before:
                    self.trace_id = tr["trace_id"]
                    self.trace_seen_at = el()
                    state = tr.get("state", "?")
                    print(f"[{el():>5}] ТРЕЙС ВИДЕН в списке: {self.trace_id} state={state}")
                    break
            if self.trace_id is None:
                return

        resp = requests.get(
            f"{self.base}/api/3.0/mlflow/traces/batchGet",
            params={"trace_ids": self.trace_id},
            timeout=10,
        )
        traces = resp.json().get("traces", [])
        if not traces:
            return
        spans = traces[0].get("spans") or []
        state = traces[0].get("trace_info", {}).get("state", "?")
        self.samples.append((el(), len(spans), state))
        for sp in spans:
            name = sp.get("name", "?")
            # span_id у OTel-спана уникален; если сервер его не отдал, откатываемся
            # на имя — хуже, но лучше, чем потерять спан из замера совсем.
            span_id = sp.get("span_id") or sp.get("spanId") or name
            if span_id not in self.span_seen_at:
                self.span_seen_at[span_id] = el()
                self.span_names[span_id] = name
                print(f"[{el():>5}] спан доехал: {name}")


def search_traces(base: str, experiment_id: str, max_results: int) -> list[dict]:
    """Список трейсов эксперимента. Ошибку сервера объясняет, а не роняет стеком."""
    url = f"{base.rstrip('/')}/api/3.0/mlflow/traces/search"
    try:
        resp = requests.post(
            url,
            json={
                "locations": [{"mlflow_experiment": {"experiment_id": experiment_id}}],
                "max_results": max_results,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("traces", [])
    except requests.RequestException as exc:
        raise SystemExit(
            f"сервер не ответил на {url}: {exc}\n"
            "Проверь MLFLOW_TRACKING_URI и версию сервера: traces/search появился "
            "в MLflow 3.x, а инкрементальная доставка спанов — с 3.4."
        ) from exc


def known_traces(base: str, experiment_id: str) -> set[str]:
    """Трейсы, которые уже были до старта — чтобы не принять старый за новый."""
    return {t["trace_id"] for t in search_traces(base, experiment_id, 20)}


# --- что именно прогоняем ----------------------------------------------------


async def run_fake(local_done: list[tuple[str, float]]) -> None:
    """Автономный режим: та же форма трейса, но вместо агентов — сон.

    Проверяет ровно доставку спанов, поэтому ни ключа, ни модели не нужно.
    """
    from tracing import run_span, step_span  # тот же модуль, что и в проекте

    with run_span("realtime_probe", inputs={"mode": "fake"}) as out:
        for step, delay in (("10_first", 4), ("20_second", 5), ("30_third", 4)):
            with step_span(step, inputs={"input": step}):
                await asyncio.sleep(delay)
            local_done.append((step, el()))
            print(f"[{el():>5}] шаг закрыт локально: {step}")
        out.update({"status": "ok"})


async def run_real(local_done: list[tuple[str, float]]) -> None:
    """Прогон СВОЕГО конвейера — под проект правится здесь.

    Достаточно вызвать свою точку входа и после каждого шага дописать
    `local_done.append((имя_шага, el()))` — имя должно совпадать с именем,
    которое шаг передаёт в `step_span()`. Список, а не словарь: имена шагов
    повторяются, и каждое закрытие должно попасть в замер отдельной строкой.
    """
    raise SystemExit(
        "run_real не заполнен: подставьте сюда вызов своего конвейера "
        "(и local_done.append((шаг, el())) после каждого шага)"
    )


# --- замер -------------------------------------------------------------------


async def main() -> None:
    load_dotenv()
    real = "--real" in sys.argv
    exp_name = os.getenv("MLFLOW_EXPERIMENT", "realtime-probe")

    from tracing import setup_tracing

    if not setup_tracing(exp_name):
        raise SystemExit("MLFLOW_TRACKING_URI пуст — замерять нечего")

    import mlflow

    base = os.environ["MLFLOW_TRACKING_URI"].strip()
    if not base.startswith(("http://", "https://")):
        raise SystemExit(
            f"MLFLOW_TRACKING_URI = {base!r} — это не HTTP-сервер, а локальное "
            "хранилище. Опрашивать нечего: подними `mlflow server` и укажи его "
            "адрес, иначе замер видимости смысла не имеет."
        )

    experiment = mlflow.get_experiment_by_name(exp_name)
    if experiment is None:
        raise SystemExit(
            f"эксперимент {exp_name!r} не найден на {base} — трейсинг включился, "
            "но эксперимент не создан. Проверь MLFLOW_EXPERIMENT и права на запись."
        )

    before = known_traces(base, experiment.experiment_id)
    print(
        f"эксперимент {experiment.experiment_id}, трейсов до старта: {len(before)}\n"
        f"батч={os.getenv('MLFLOW_ASYNC_TRACE_LOGGING_MAX_SPAN_BATCH_SIZE')} "
        f"интервал={os.getenv('MLFLOW_ASYNC_TRACE_LOGGING_MAX_INTERVAL_MILLIS')} мс"
    )

    poller = Poller(base, experiment.experiment_id, before)
    poller.start()

    local_done: list[tuple[str, float]] = []
    print(f"[{el():>5}] старт")
    await (run_real(local_done) if real else run_fake(local_done))
    print(f"[{el():>5}] запуск завершён — ждём хвост доставки")
    await asyncio.sleep(12)
    poller.stop_flag.set()
    poller.join(timeout=5)

    print("\n=== ИТОГ ===")
    print(f"трейс появился в списке на: {poller.trace_seen_at} с")
    # Одноимённые шаги сопоставляются по порядку: N-е закрытие — с N-м приходом
    # спана с этим именем. Для последовательного конвейера это точно; шаги,
    # идущие параллельно, могут приехать не в том порядке, в каком закрылись.
    occurrence: dict[str, int] = {}
    for step, done_at in local_done:
        i = occurrence.get(step, 0)
        occurrence[step] = i + 1
        arrivals = poller.arrivals(step)
        seen = arrivals[i] if i < len(arrivals) else None
        lag = round(seen - done_at, 1) if seen is not None else None
        print(f"  {step:<16} закрыт {done_at:>5} с → виден {seen} с (отставание {lag} с)")
    print("спанов на сервере по секундам:")
    for at, n, state in poller.samples:
        print(f"  {at:>5} с: {n:>2} спанов, state={state}")
    print(f"trace_id: {poller.trace_id}")


if __name__ == "__main__":
    asyncio.run(main())
