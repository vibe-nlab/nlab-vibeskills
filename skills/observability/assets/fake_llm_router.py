"""Заглушка LLM-роутера: OpenAI-совместимый /v1/chat/completions с поддельными ответами.

Зачем. Полный прогон на живом роутере стоит ~300k входных токенов, и основная их часть —
не материал, а реестры правил в промптах стадий; коротким входом это не срезать. При этом
проверять инфраструктуру (трейсинг, вложенность спанов, сессию, превью, вердикт) на живой
модели незачем — её ответы для этого не нужны.

Чем это лучше подмены модели в тестах (`FunctionModel`). Там подменяется САМА модель, то
есть выпадает весь боевой путь: OpenAI-SDK, HTTP, `OpenAIChatModel` и его инструментация.
Именно поэтому баг с перетиранием сессии (`gen_ai.conversation.id` от pydantic-ai) на
`FunctionModel` не воспроизводился, а на живом роутере — да. Заглушка подменяет только
сеть: всё выше по стеку остаётся настоящим.

Запуск:
    python tools/fake_llm_router.py --port 8765
    LLM_API_URL=http://127.0.0.1:8765/v1/chat/completions LLM_API_KEY=fake …

Ответы ниже — **обезличенные рыбы, их положено заменить своими**: правится один блок
`ROUTES` (маркер в системном промпте → ответ). Единственное требование к ответу — он
должен быть достаточно правдоподобным для следующего шага и в том формате, который
ждёт ваш парсер. Иначе конвейер упадёт на разборе, до конца не дойдёт, и проверка
трейсинга выйдет неполной — а проверяется именно полный путь.
"""
import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ── НИЖЕ ДО КОНЦА БЛОКА — ЗАМЕНИТЬ ПОД СВОЙ ПРОЕКТ ─────────────────────────────
# Рыбы намеренно обезличены: свои поля, свои имена шагов, свой формат.

STRUCTURED = """```yaml
items:
  - title: "Заглушка: первый элемент"
    kind: risk
    detail: "ответ заглушки, живая модель не вызывалась"
  - title: "Заглушка: второй элемент"
    kind: advantage
    detail: "ответ заглушки, живая модель не вызывалась"
```"""

SUMMARY = """## Итог (заглушка)

Живая модель не вызывалась — это ответ локальной заглушки роутера.

- пункт-заглушка 1
- пункт-заглушка 2
"""

GENERIC = """```yaml
result: ok
note: "ответ заглушки, живая модель не вызывалась"
```"""

# Маркер в системном промпте → ответ. Первое совпадение выигрывает, ни одного —
# GENERIC. Маркерами удобно делать имена ролей/шагов из ваших системных промптов.
ROUTES = [
    (("проверь", "verify", "check"), STRUCTURED),
    (("отчёт", "итог", "report", "summary"), SUMMARY),
]


def pick(system: str) -> str:
    s = (system or "").lower()
    for markers, answer in ROUTES:
        if any(m in s for m in markers):
            return answer
    return GENERIC


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):                                    # noqa: N802
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])) or b"{}")
        system = next((m.get("content") for m in body.get("messages", [])
                       if m.get("role") == "system"), "")
        if isinstance(system, list):                       # мультимодальный вход
            system = " ".join(p.get("text", "") for p in system if isinstance(p, dict))
        text = pick(system)
        out = {
            "id": f"chatcmpl-fake-{int(time.time()*1000)}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": body.get("model", "fake-model"),
            "choices": [{"index": 0, "finish_reason": "stop",
                         "message": {"role": "assistant", "content": text}}],
            # правдоподобные, но нулевые по деньгам числа: конвейер читает usage
            "usage": {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150},
        }
        data = json.dumps(out).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):                             # без шума в stdout
        pass


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    args = ap.parse_args()
    print(f"заглушка роутера на http://127.0.0.1:{args.port}/v1/chat/completions", flush=True)
    # Threading, а не HTTPServer: одиночный сервер обрабатывает запросы строго по
    # очереди, и параллельные шаги конвейера выстраиваются в цепочку — в трейсе
    # веер параллельных шагов выглядит последовательностью, то есть проверяется
    # не то, что работает в проде.
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
