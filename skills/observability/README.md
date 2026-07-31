# /nlab:observability — трейсинг агентов в общий MLflow

Скилл для Claude Code. Подключает проект с pydantic-ai-агентами к
обсервабилити NeuroLab: каждый запуск агента пишется трейсом в общий
MLflow-сервер — видно промпт, сообщения, вызовы LLM/инструментов/MCP,
ответ и токены. Юзер-инпуты привязываются к трейсам тегами
session/user.

## Установка

Скилл входит в плагин `nlab` — ставится вместе со всем пакетом.
См. [README реестра](../../README.md).

## Использование

1. Откройте Claude Code в корне проекта (бэкенд с агентами уже должен
   существовать).
2. Наберите `/nlab:observability`.
3. Claude добавит `mlflow` в зависимости, создаст
   `backend/infrastructure/tracing.py`, пропишет `MLFLOW_TRACKING_URI`
   в env-файлы и проверит работу на живом вызове агента.

## Адрес сервера

Адрес общего сервера живёт в
[references/mlflow-server.md](references/mlflow-server.md). Если его там
нет — запросите у [@sanchezgl](https://t.me/sanchezgl) или
[@KirillBorovkov](https://t.me/KirillBorovkov). Пока адреса нет,
`MLFLOW_TRACKING_URI` остаётся пустым — трейсинг просто выключен,
приложение работает как обычно; адрес потом вписывается в env без
правок кода.
