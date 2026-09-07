# Dokploy API — проверенный справочник

Все вызовы: `<url>/api/<endpoint>`, где `<url>` и токен — из записи выбранного
сервера в реестре `~/.claude/nlab/dokploy-servers.md`.
Заголовки: `x-api-key: <api-key>` (+ `Content-Type: application/json` для POST).

GET-эндпоинты принимают параметры query-строкой, POST — JSON-телом.
Все payload'ы ниже проверены в бою (июль 2026, Dokploy v0.25+; сентябрь 2026,
v0.30.5). Полный список маршрутов конкретной панели — `GET settings.getOpenApiDocument`
(OpenAPI JSON, ~750 КБ): смотри туда, если эндпоинт отвечает 404 «Not found» — имя
роутера могло отличаться (так `mount.create` не существует, есть `mounts.create`).

## Обзор и проекты

```
GET  project.all                     # дерево: проекты → environments → compose/applications/БД со статусами
GET  project.one?projectId=<id>      # один проект; environments[0].environmentId нужен для compose.create
POST project.create                  # {"name": "...", "description": "..."} → {project: {projectId}, environment: {environmentId}}
                                     # проект = кластер сервисов (infra/agents/tools/research), не «один проект на сервис»
```

Статусы сервисов: `idle` | `running` (деплой идёт) | `done` | `error`.
`project.all` — также самый быстрый способ проверить валидность токена
нового сервера (401 = токен неверный).

## Git-провайдеры

```
GET github.githubProviders                                # список: [{githubId, gitProvider: {...}}]
GET github.getGithubRepositories?githubId=<githubId>      # какие репо видит провайдер (включая приватные)
```

`githubId` нужен для привязки сервисов к GitHub. На новом сервере — узнай его
через `github.githubProviders`; если список пуст, GitHub App не подключен
(Dokploy UI → Settings → Git) и деплой из приватных репо невозможен.

## Compose-сервисы

```
GET  compose.one?composeId=<id>      # вся конфигурация: sourceType, repository, branch, composePath, env, appName, composeStatus
POST compose.create                  # {"name": "...", "environmentId": "...", "composeType": "docker-compose", "appName": "<проект>-<репо>", "description": "..."} → {composeId, appName, ...}
                                     # appName можно задать явно (Dokploy допишет случайный суффикс) — иначе будет compose-<три-слова>-xxxx
POST compose.update                  # {"composeId": "...", ...любые поля...}
POST compose.deploy                  # {"composeId": "..."} — ПОЛНЫЙ деплой: git clone + build + up (свежий коммит/ветка)
POST compose.redeploy                # {"composeId": "..."} — rebuild из УЖЕ СКАЧАННОГО чекаута, git НЕ тянет!
                                     # После смены branch или пуша нового кода — только compose.deploy
                                     # (проверено 2026-07-17: redeploy после смены ветки собрал старый код).
```

Привязка к GitHub через встроенный провайдер (`compose.update`):

```json
{
  "composeId": "...",
  "sourceType": "github",
  "githubId": "<githubId сервера>",
  "owner": "<github-аккаунт>",
  "repository": "<имя-репо-без-owner>",
  "branch": "main",
  "composePath": "docker-compose.dokploy.yml",
  "env": "KEY=value\nKEY2=value2"
}
```

- `env` — одна строка, переменные через `\n`, формат dotenv.
- Обновление env: **сначала** `compose.one` → прочитай текущий `env`, измени
  нужное, запиши блок целиком (это замена, не merge). Потом redeploy.

## Домены

```
GET  domain.byComposeId?composeId=<id>
POST domain.create
POST domain.update                   # те же поля + domainId
POST domain.delete                   # {"domainId": "..."}
```

`domain.create` для compose-сервиса:

```json
{
  "composeId": "...",
  "domainType": "compose",
  "host": "sub.example.com",
  "path": "/",
  "port": 8000,
  "serviceName": "backend",
  "https": true,
  "certificateType": "letsencrypt"
}
```

- `serviceName` — имя сервиса из compose-файла, `port` — внутренний порт
  контейнера (на хост ничего не пробрасывается).
- HTTP→HTTPS редирект Dokploy делает сам (301).
- Для application-сервисов — `"domainType": "application"`, `applicationId`
  вместо `composeId`, без `serviceName`.
- Перед созданием проверь DNS: `dig +short <host>` → IP сервера, иначе
  Let's Encrypt не выпустит сертификат.

## Деплои и логи

```
GET deployment.allByCompose?composeId=<id>   # история деплоев: deploymentId, status, logPath
```

Лог конкретного деплоя — через API, SSH не нужен:

```
GET deployment.readLogs?deploymentId=<id>&tail=400     # tail 1..10000, дефолт 100
GET deployment.allByType?id=<composeId|applicationId>&type=compose|application
```

Ответ `readLogs` — строка с логом сборки и `docker compose up` (Created / Started /
Healthy / Exited по контейнерам). По SSH то же самое: `tail -100 '<logPath>'`.

Состояние контейнеров без SSH:

```
GET docker.getContainers                                # все контейнеры сервера: name, state (running/restarting/exited), status
GET docker.getContainersByAppNameMatch?appName=<appName>
GET docker.getConfig?containerId=<id>                   # docker inspect
```

stdout/stderr контейнера API не отдаёт (только веб-сокет UI) — падающий контейнер
воспроизводи локально тем же Dockerfile.

Рантайм-логи контейнеров (SSH, только чтение):

```bash
ssh <ssh> "docker ps -a --filter name=<appName>"   # appName из compose.one
ssh <ssh> "docker logs --tail 200 <container>"
```

## Applications (не-compose сервисы)

Симметрично compose: `application.one?applicationId=`, `application.create`,
`application.update`, `application.deploy`, `application.redeploy`,
`deployment.allByApplication?applicationId=`.

Сервис из одного Dockerfile (проверено 2026-09-06, s3-gateway):

```json
POST application.create  {"name": "s3-gateway", "appName": "infra-s3-gateway", "environmentId": "...", "description": "..."}
POST application.update  {"applicationId": "...", "sourceType": "github", "githubId": "...", "owner": "sber-nlab",
                          "repository": "rag-s3-gateway", "branch": "main", "buildType": "dockerfile",
                          "dockerfile": "Dockerfile", "dockerContextPath": ".", "env": "KEY=value\n..."}
POST domain.create       {"applicationId": "...", "domainType": "application", "host": "...", "path": "/", "port": 8401,
                          "https": true, "certificateType": "letsencrypt"}
POST application.deploy  {"applicationId": "..."}      # ответ — пустое тело, статус смотри в application.one
```

## Файловые маунты (секретные файлы вне образа)

Роутер называется `mounts` (во множественном числе; `mount.create` → 404 «Not found»):

```json
POST mounts.create  {"type": "file", "content": "<содержимое файла>", "filePath": "keys.yaml",
                     "mountPath": "/app/keys.yaml", "serviceType": "application", "serviceId": "<applicationId>"}
GET  mounts.listByServiceId?serviceId=...
POST mounts.update / mounts.remove
```

`serviceId` — applicationId или composeId, `serviceType` — `application` | `compose` | тип БД.
Файл пишется на диск сервера при деплое: маунт, созданный **после** деплоя, попадёт в
контейнер только следующим `deploy`/`redeploy`. Текущие маунты сервиса видны в
`application.one` / `compose.one` → `mounts[]` (с содержимым).

## Паттерн: дождаться конца деплоя

Деплой асинхронный (`Deployment queued`). Отслеживай циклом:

```bash
prev=""
while true; do
  st=$(curl -s -m 10 -H "x-api-key: $KEY" \
    "$URL/api/compose.one?composeId=$ID" \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('composeStatus','?'))" 2>/dev/null || echo poll-fail)
  [ "$st" != "$prev" ] && echo "composeStatus: $st" && prev=$st
  case "$st" in done|error) exit 0;; esac
  sleep 15
done
```

Сборка образа обычно занимает 2–5 минут. После `done` — health-проверки по
доменам; после `error` — логи деплоя (см. выше).
