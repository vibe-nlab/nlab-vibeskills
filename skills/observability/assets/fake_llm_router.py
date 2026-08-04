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

Ответы подбираются по системному промпту шага. **Под свой проект замените
`VERIFIER`/`GENERIC`/`REPORT` и функцию `pick()`**: важно, чтобы ответ был достаточно
правдоподобным для следующего шага, иначе конвейер не дойдёт до конца и проверка выйдет
неполной.
"""
import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

VERIFIER = """```yaml
meta_verdicts:
  misleads: {verdict: false, comment: "заглушка"}
  reputation: {verdict: works, comment: "заглушка"}
  ca_language: {verdict: true, comment: "заглушка"}
verified:
  - observation: "Заглушка: наблюдение-риск"
    evidence: "цитата из паспорта"
    polarity: risk
    severity: major
    ekk_category: product
    rule_id: null
  - observation: "Заглушка: наблюдение-преимущество"
    evidence: "цитата из паспорта"
    polarity: advantage
    severity: minor
    ekk_category: product
    rule_id: null
ekk_heatmap:
  product: 2
```"""

GENERIC = """```yaml
observations:
  - observation: "Заглушка: наблюдение стадии"
    evidence: "цитата из паспорта"
    polarity: risk
    rule_id: null
    mechanism: null
    argumentation: "ответ заглушки, живая модель не вызывалась"
```"""

REPORT = """## Отчёт (заглушка)

Живая модель не вызывалась — это ответ локальной заглушки роутера.

report_markdown: |
  ### Сильные стороны
  - заглушка
  ### Зоны роста
  - заглушка
"""


def pick(system: str) -> str:
    s = (system or "").lower()
    if "верификатор" in s or "verifier" in s:
        return VERIFIER
    if "синтезатор" in s or "отчёт" in s:
        return REPORT
    if "переводчик" in s:                      # дайджест
        return "**Вход стадии:** заглушка.\n**Что проверялось:** ничего, это заглушка."
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
    HTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
