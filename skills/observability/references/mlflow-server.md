# Общий MLflow Tracking Server NeuroLab

Каноничное место, где живёт адрес общего сервера трейсинга. Обновляется
только через реестр (как сами скиллы), локально не редактировать.

## Адрес

| Параметр | Значение |
|---|---|
| `MLFLOW_TRACKING_URI` | **НЕ РАЗВЁРНУТ** — адреса пока нет (на 2026-07-31) |
| Доступ (логин/токен) | выдаётся вместе с адресом |

**Адреса здесь нет → спроси у ответственных** в Telegram:
[@sanchezgl](https://t.me/sanchezgl) или
[@KirillBorovkov](https://t.me/KirillBorovkov) — те же, кто выдаёт
репозитории и LLM-ключи. Пока адрес не выдан:

- в проекте `MLFLOW_TRACKING_URI` остаётся **пустым** — трейсинг выключен,
  приложение работает как обычно (это штатный режим, не ошибка);
- свой MLflow-сервер под проект **не поднимать** — смысл в одном общем
  месте, где видны трейсы всех агентов; когда сервер появится, адрес
  впишется в env без правок кода;
- адрес появился → вписать его сюда (через реестр) и в env проектов.

## Как это работает

Один Tracking Server на компанию. У каждого проекта — свой **experiment**
с именем выданного репозитория. Агенты пишут трейсы по
`MLFLOW_TRACKING_URI` из окружения; UI сервера — то же самое URI в браузере.

Что смотреть в UI: experiment проекта → вкладка **Traces** → трейс =
дерево спанов «agent run → LLM-вызовы → tool/MCP-вызовы»; внутри спанов —
промпты, ответы, аргументы инструментов, токены и латентность. Диалоги
группируются по тегам `mlflow.trace.session` / `mlflow.trace.user`.

## Каноничный compose для развёртывания (когда придёт время)

Разворачивается один раз на Dokploy-сервере компании по конвенциям
`/nlab:dokploy-prep` (веб-сервис в `dokploy-network`, данные в named
volumes, без хост-портов; домен и TLS — через вкладку Domains). Основа:

```yaml
services:
  mlflow:
    image: ghcr.io/mlflow/mlflow:latest   # зафиксировать конкретную версию
    command: >
      mlflow server
      --backend-store-uri postgresql://mlflow:${POSTGRES_PASSWORD:?}@mlflow-db:5432/mlflow
      --artifacts-destination /mlflow-artifacts
      --host 0.0.0.0 --port 5000
    volumes:
      - mlflow-artifacts:/mlflow-artifacts
    networks: [dokploy-network, internal]
    depends_on:
      mlflow-db:
        condition: service_healthy

  mlflow-db:
    image: postgres:16
    environment:
      POSTGRES_USER: mlflow
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
      POSTGRES_DB: mlflow
    volumes:
      - mlflow-db:/var/lib/postgresql/data
    networks: [internal]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mlflow"]
      interval: 5s
      retries: 10

volumes:
  mlflow-artifacts:
  mlflow-db:

networks:
  dokploy-network:
    external: true
  internal: {}
```

Обязательно при развёртывании: аутентификация (у MLflow есть встроенный
basic-auth app — `mlflow server --app-name basic-auth`, либо auth на уровне
реверс-прокси) — трейсы содержат промпты и данные пользователей, наружу
без пароля их не выставлять. Актуальные детали сверить по
<https://mlflow.org/docs/latest/self-hosting/>.
