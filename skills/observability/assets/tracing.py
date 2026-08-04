"""Трейсинг агентов в общий MLflow — конвенция NeuroLab.

Копируется скиллом /nlab:observability в backend/infrastructure/tracing.py
и адаптируется под проект. Правила:

- `setup_tracing()` вызывается ОДИН раз при старте приложения
  (FastAPI lifespan / main), до первого запуска агентов.
- Выключатель: пустой или отсутствующий MLFLOW_TRACKING_URI означает
  «трейсинг выключен» — приложение обязано работать как обычно.
- Обсервабилити никогда не роняет приложение: функции глотают свои
  исключения и пишут их в лог. Это правило enforcement — не вырезать.

Актуальный API сверять по докам, не по памяти:
https://mlflow.org/docs/latest/genai/tracing/integrations/listing/pydantic_ai/
"""

import contextlib
import logging
import os

logger = logging.getLogger(__name__)

_enabled = False


def enabled() -> bool:
    """Включён ли трейсинг. Пока `setup_tracing()` не сказала «да», mlflow даже
    не импортируется — проект без трейсинга за него не платит."""
    return _enabled


def setup_tracing(service_name: str) -> bool:
    """Включает MLflow-трейсинг агентов, если задан MLFLOW_TRACKING_URI.

    Возвращает True, если трейсинг включён, False — если выключен или не
    удалось включить.
    """
    global _enabled
    uri = os.getenv("MLFLOW_TRACKING_URI", "").strip()
    if not uri:
        logger.info("MLFLOW_TRACKING_URI пуст — трейсинг выключен")
        _enabled = False
        return False
    # Читается при инициализации OTel-провайдера MLflow, поэтому выставляется ДО
    # первого обращения к mlflow. Без него спаны pydantic-ai не видят родителя из
    # `step_span()` и уезжают ОТДЕЛЬНЫМ трейсом: в UI два несвязанных дерева на
    # один шаг, а тег сессии остаётся на пустом.
    os.environ.setdefault("MLFLOW_TRACE_PROPAGATE_TO_OTEL_CONTEXT", "True")
    try:
        import mlflow

        mlflow.set_tracking_uri(uri)
        mlflow.set_experiment(os.getenv("MLFLOW_EXPERIMENT", service_name))
        mode = _enable_autolog(mlflow)
    except Exception:
        logger.exception("Не удалось включить MLflow-трейсинг — работаем без него")
        _enabled = False
        return False
    _enabled = True
    logger.info("MLflow-трейсинг включён: %s (experiment %s, режим %s)", uri,
                os.getenv("MLFLOW_EXPERIMENT", service_name), mode)
    return True


def _enable_autolog(mlflow) -> str:
    """Включает трассировку агентов. Возвращает имя сработавшего режима.

    Порядок — от «как в доке MLflow» к тому, что работает на pydantic-ai 2.x.

    1. **`mlflow.pydantic_ai.autolog()`** — штатный флейвор из доки MLflow. Но
       дока написана под pydantic-ai **1.x**: она предлагает
       `Agent("model", instrument=True)`, и флейвор ровно этот аргумент
       подставляет в `Agent.__init__` патчем. В pydantic-ai **2.x** аргумент из
       конструктора убрали — он переехал в `Agent.instrument_all()`.
       Коварство: `autolog()` отрабатывает молча и успешно, а `TypeError`
       падает потом на КАЖДОМ создании агента, то есть на каждом вызове.
       Поэтому после включения обязательна проба пробным агентом, а не доверие
       к тому, что исключения не было.
       (Проверено на mlflow 3.15.1 + pydantic-ai 2.23.0, 2026-08-04.)

    2. **Нативная OTel-инструментация pydantic-ai через мост MLflow** —
       `Agent.instrument_all(InstrumentationSettings(tracer_provider=...))`, где
       provider берётся из `mlflow.tracing.get_bridged_tracer_provider()`. Мост
       существует ровно для этого: спаны сторонней OTel-инструментации получают
       правильный trace_id и уезжают в MLflow. Спаны выходят богаче флейвора —
       `invoke_agent` типа AGENT с вложенным CHAT_MODEL и атрибутами `gen_ai.*`
       (модель, провайдер, токены, сообщения) по семантическим конвенциям OTel.

    3. **`mlflow.openai.autolog()`** — последний рубеж для проектов, чей
       транспорт ходит через OpenAI-совместимый SDK: промпты, ответы и токены
       в трейс попадут, агентского уровня в них не будет.

    Все три режима — MLflow. Отклонения от дефолта компании здесь нет.
    """
    try:
        mlflow.pydantic_ai.autolog()
        from pydantic_ai import Agent
        from pydantic_ai.models.test import TestModel

        Agent(TestModel(), output_type=str)   # проба: ломает ли патч конструктор
        return "pydantic_ai"
    except Exception as e:  # noqa: BLE001
        logger.info("флейвор mlflow.pydantic_ai не подходит к этой версии pydantic-ai "
                    "(%s) — перехожу на нативную OTel-инструментацию через мост MLflow", e)
        try:
            mlflow.pydantic_ai.autolog(disable=True)
        except Exception:
            logger.exception("не удалось выключить неподходящий флейвор")

    try:
        from mlflow.tracing import get_bridged_tracer_provider
        from pydantic_ai import Agent
        from pydantic_ai.models.instrumented import InstrumentationSettings

        # include_content=True — иначе в трейсе будут только метаданные вызова,
        # без промптов и ответов, а именно они и нужны, чтобы агент перестал
        # быть чёрным ящиком.
        Agent.instrument_all(InstrumentationSettings(
            tracer_provider=get_bridged_tracer_provider(), include_content=True))
        return "pydantic_ai_otel"
    except Exception as e:  # noqa: BLE001
        logger.warning("нативная инструментация pydantic-ai недоступна (%s) — остаётся "
                       "mlflow.openai.autolog(): промпты, ответы и токены в трейсах "
                       "будут, агентского уровня — нет", e)
        mlflow.openai.autolog()
        return "openai"


@contextlib.contextmanager
def step_span(name: str, session_id: str = ""):
    """Родительский спан вокруг логического шага — стадии конвейера, обработки
    запроса, того, что в проекте является единицей работы.

    Зачем, если автолог и так видит вызовы: он не знает, к какому запуску и к
    какому шагу вызов относится. Без этого спана многошаговый прогон ложится в
    UI плоским списком безымянных вызовов. `session_id` (id прогона, диалога)
    группирует шаги одного запуска вместе.

    Трейсинг выключен или сломался — контекст пустой, вызывающий код об этом
    не знает.
    """
    if not _enabled:
        yield
        return
    try:
        import mlflow
    except Exception:  # noqa: BLE001 — mlflow не поставлен: не повод ронять работу
        logger.exception("mlflow недоступен — шаг пойдёт без трейса")
        yield
        return
    try:
        with mlflow.start_span(name=name or "step") as span:
            if session_id:
                try:
                    mlflow.update_current_trace(
                        metadata={"mlflow.trace.session": session_id})
                    span.set_attribute("session_id", session_id)
                except Exception:
                    logger.exception("не удалось проставить теги трейса")
            yield
    except Exception:
        # Исключение самого MLflow (сеть, недоступный сервер) не должно подменять
        # собой исключение шага: ошибку шага пробрасываем, ошибку трейсинга — в лог.
        logger.exception("сбой трейсинга шага %s — работа продолжается", name)
        yield


def tag_current_trace(
    session_id: str | None = None, user_id: str | None = None
) -> None:
    """Привязывает текущий трейс к сессии и пользователю.

    Вызывать внутри обработчика запроса (или middleware), где session_id /
    user_id известны. Ключи mlflow.trace.session / mlflow.trace.user —
    стандартные: по ним UI MLflow группирует диалоги.
    """
    if not (_enabled and (session_id or user_id)):
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
