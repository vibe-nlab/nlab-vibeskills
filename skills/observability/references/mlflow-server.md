# Общий MLflow Tracking Server NeuroLab

Каноничное место, где живёт адрес общего сервера трейсинга и правила доступа
к нему. Обновляется только через реестр (как сами скиллы), локально не
редактировать. **Паролей и токенов здесь нет и не будет** — реестр публичный;
секреты живут в Vault (ниже).

## Адрес

| Параметр | Значение |
|---|---|
| `MLFLOW_TRACKING_URI` | `https://mlflow.a.nlabstudio.ru` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | `https://mlflow.a.nlabstudio.ru/v1/traces` — для пути «OTLP» (SKILL.md §4) |
| UI | тот же адрес в браузере, вход по тем же логину/паролю |
| Доступ | basic-auth (встроенный `basic-auth` MLflow); без логина сервер отвечает 401 на всё, включая `/v1/traces` |
| Развёрнут | 2026-09-06, главный Dokploy-сервер лаборатории; конфиг — в репо инфраструктуры `sber-nlab/infrastructure`, здесь не дублируется |
| Версия сервера | 3.16.0 на 2026-09-07 (инкрементальная доставка спанов и OTLP-ингест есть) |

Сервер один на компанию. Свой MLflow под проект **не поднимать** — смысл в
одном месте, где видны трейсы всех агентов.

## Доступ: логин/пароль — из Vault

Все проекты пишут трейсы от одного сервисного аккаунта (не админского). Его
логин и пароль лежат в Vault, а не в этом файле, не в чате и не в репо проекта:

| Параметр | Значение |
|---|---|
| `VAULT_ADDR` | `https://vault.a.nlabstudio.ru` |
| Секрет | KV v2, путь `secret/platform/mlflow`, поля `uri`, `username`, `password` |
| Токен разработчика | `VAULT_TOKEN` с политикой `mlflow-agents-ro` — читает **только** этот секрет; личный, выдаётся на человека |
| Кто выдаёт токен | [@sanchezgl](https://t.me/sanchezgl) / [@KirillBorovkov](https://t.me/KirillBorovkov) — руками или через бота; те же, кто выдаёт репозитории и LLM-ключи |

**Код-агент забирает креды сам**, если у разработчика есть токен (в env
`VAULT_TOKEN` или в файле `~/.vault-token` — туда его кладёт `vault login`):

```bash
curl -sf -H "X-Vault-Token: ${VAULT_TOKEN:-$(cat ~/.vault-token)}" \
  "https://vault.a.nlabstudio.ru/v1/secret/data/platform/mlflow" \
| python3 -c 'import sys, json; d = json.load(sys.stdin)["data"]["data"]
print(f"MLFLOW_TRACKING_URI={d[\"uri\"]}")
print(f"MLFLOW_TRACKING_USERNAME={d[\"username\"]}")
print(f"MLFLOW_TRACKING_PASSWORD={d[\"password\"]}")'
```

То же через CLI: `vault kv get -format=json secret/platform/mlflow`.

Куда это кладётся — и куда нет:

- **в `.env` проекта** (он в `.gitignore`; проверь `git check-ignore -q .env`)
  — три строки выше. Приложению Vault не нужен: клиент MLflow читает
  `MLFLOW_TRACKING_USERNAME` / `MLFLOW_TRACKING_PASSWORD` из окружения сам,
  никакого кода под авторизацию писать не надо;
- **в `.env.dokploy.example`** — те же имена переменных с **пустыми** значениями
  и комментарием `# из Vault: secret/platform/mlflow`. Хостящий берёт значения
  из Vault и вписывает в Dokploy Environment (политика `dokploy-ro` этот секрет
  читает);
- **никуда больше**: не в код, не в `NOTES.md`/`EVIDENCE.md`, не в коммит, не в
  описание PR, не в лог. `VAULT_TOKEN` в `.env` тоже не пишется — он нужен один
  раз, чтобы забрать секрет, и живёт в shell/`~/.vault-token`.

Токена нет → трейсинг **выключен** (`MLFLOW_TRACKING_URI` пустой), приложение
работает как обычно; интеграция ставится сейчас, значения впишутся позже без
правок кода. Пароль в чате у пользователя не просить — просить токен Vault у
ответственных. Пароль сменили → обновляется секрет в Vault, проекты забирают
заново; в git ничего не меняется.

## Путь «OTLP» (без пакета `mlflow`): авторизация заголовком

Экспортёр OTel не читает переменные MLflow, поэтому логин/пароль передаются
заголовком `Authorization: Basic <base64(username:password)>` вместе с id
эксперимента — оба в одной переменной, через запятую:

```bash
BASIC=$(printf '%s:%s' "$MLFLOW_TRACKING_USERNAME" "$MLFLOW_TRACKING_PASSWORD" | base64)
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://mlflow.a.nlabstudio.ru/v1/traces
OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Basic ${BASIC},x-mlflow-experiment-id=<id>"
```

Пробел внутри `Basic …` и `=` в хвосте base64 SDK OpenTelemetry разбирает
правильно (проверено на opentelemetry-sdk 1.x, 2026-09-07). Эксперимент на этом
пути надо **создать заранее** — экспортёр его не создаёт, а без id сервер спаны
не примет:

```bash
curl -sf -u "$MLFLOW_TRACKING_USERNAME:$MLFLOW_TRACKING_PASSWORD" \
  -X POST https://mlflow.a.nlabstudio.ru/api/2.0/mlflow/experiments/create \
  -H 'Content-Type: application/json' -d '{"name": "<имя-репозитория>"}'
# уже есть → 400 RESOURCE_ALREADY_EXISTS; id: …/experiments/get-by-name?experiment_name=<имя>
```

Неверный пароль на этом пути **не роняет** приложение: экспортёр печатает
`Failed to export span batch code: 401` в лог и трейсы молча теряются — после
первого прогона проверь, что трейс реально появился в UI.

## Известная ловушка: обычному аккаунту сервер не отдаёт `/version`

Basic-auth MLflow ≥ 3.16 по умолчанию работает fail-closed
(`MLFLOW_BASIC_AUTH_FAIL_CLOSED=true`): маршруты без явного правила доступа
отдаются только админам, и `GET /version` среди них. Сервисному аккаунту он
отвечает `Permission denied`. Клиент MLflow по этому маршруту узнаёт версию
сервера и только тогда включает инкрементальный `log_spans` (нужен ≥ 3.4);
не узнал — молча пишет трейс целиком в конце запуска. Симптомы на стороне
проекта (проверено 2026-09-07 на сервере 3.16.0):

- в UI трейс появляется только после конца запуска, сразу со `state=OK`;
- `realtime_probe.py` печатает «виден None» по всем шагам и предупреждение про
  `/version`; тот же прогон от админа — `IN_PROGRESS`, шаги едут по одному;
- `GET /api/3.0/mlflow/traces/batchGet` отвечает 500
  `Trace data not stored in tracking store` (спаны ушли артефактом).

Это ограничение **сервера**, не проекта: гейт реалтайма в SKILL.md §5 на
такой прогон не заваливается — в `EVIDENCE.md` пишется вывод замерялки с этим
предупреждением. Чинится владельцем сервера одной переменной окружения
`MLFLOW_BASIC_AUTH_FAIL_CLOSED=false` (маршруты API остаются под авторизацией,
открываются только «неразмеченные» вроде `/version`, и то после логина);
проверка после правки — `curl -u <логин>:<пароль> https://mlflow.a.nlabstudio.ru/version`
отдаёт номер версии. Путь «OTLP» ловушки не имеет: экспортёр OTel версию не
спрашивает, спаны едут сразу.

## Как это работает

Один Tracking Server на компанию. У каждого проекта — свой **experiment**
с именем выданного репозитория; на пути «мост» его создаёт
`mlflow.set_experiment()` при первом запуске, права на создание у сервисного
аккаунта есть. Агенты пишут трейсы по `MLFLOW_TRACKING_URI` из окружения;
UI сервера — то же самое URI в браузере.

Что смотреть в UI: experiment проекта → вкладка **Traces** → трейс =
дерево спанов «agent run → LLM-вызовы → tool/MCP-вызовы»; внутри спанов —
промпты, ответы, аргументы инструментов, токены и латентность. Диалоги
группируются по тегам `mlflow.trace.session` / `mlflow.trace.user`.

## Для тех, кто выдаёт доступ

Политика `mlflow-agents-ro` уже заведена в Vault (читает только
`secret/platform/mlflow`; на `secret/platform/*` и список префикса — 403,
проверено 2026-09-07). Личный токен разработчику:

```bash
vault token create -policy=mlflow-agents-ro -ttl=720h -display-name=<кто>
# политику default не снимать: без неё держатель не сможет продлить/отозвать свой токен
```

Тот же вызов делает бот через `POST /v1/auth/token/create`. В Vault включён
и `github`-auth для организации `vibe-nlab`: если сопоставить команду
организации с этой политикой, разработчики смогут получать токен сами через
`vault login -method=github` — решение за владельцами Vault. Root-токен Vault
и админский аккаунт MLflow никому не выдаются и в проекты не попадают.
