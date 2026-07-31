"""Трейсинг агентов в общий MLflow — конвенция NeuroLab.

Копируется скиллом /nlab:observability в backend/infrastructure/tracing.py
и адаптируется под проект. Правила:

- `setup_tracing()` вызывается ОДИН раз при старте приложения
  (FastAPI lifespan / main), до первого запуска агентов.
- Выключатель: пустой или отсутствующий MLFLOW_TRACKING_URI означает
  «трейсинг выключен» — приложение обязано работать как обычно.
- Обсервабилити никогда не роняет приложение: обе функции глотают свои
  исключения и пишут их в лог. Это правило enforcement — не вырезать.

Актуальный API сверять по докам, не по памяти:
https://mlflow.org/docs/latest/genai/tracing/integrations/listing/pydantic_ai/
"""

import logging
import os

logger = logging.getLogger(__name__)


def setup_tracing(service_name: str) -> bool:
    """Включает MLflow-трейсинг pydantic-ai, если задан MLFLOW_TRACKING_URI.

    Возвращает True, если трейсинг включён, False — если выключен или не
    удалось включить.
    """
    uri = os.getenv("MLFLOW_TRACKING_URI", "").strip()
    if not uri:
        logger.info("MLFLOW_TRACKING_URI пуст — трейсинг выключен")
        return False
    try:
        import mlflow

        mlflow.set_tracking_uri(uri)
        mlflow.set_experiment(os.getenv("MLFLOW_EXPERIMENT", service_name))
        mlflow.pydantic_ai.autolog()
    except Exception:
        logger.exception("Не удалось включить MLflow-трейсинг — работаем без него")
        return False
    logger.info("MLflow-трейсинг включён: %s", uri)
    return True


def tag_current_trace(
    session_id: str | None = None, user_id: str | None = None
) -> None:
    """Привязывает текущий трейс к сессии и пользователю.

    Вызывать внутри обработчика запроса (или middleware), где session_id /
    user_id известны. Ключи mlflow.trace.session / mlflow.trace.user —
    стандартные: по ним UI MLflow группирует диалоги.
    """
    if not (session_id or user_id):
        return
    try:
        import mlflow

        metadata: dict[str, str] = {}
        if session_id:
            metadata["mlflow.trace.session"] = session_id
        if user_id:
            metadata["mlflow.trace.user"] = user_id
        mlflow.update_current_trace(metadata=metadata)
    except Exception:
        logger.exception("Не удалось проставить теги трейса")
