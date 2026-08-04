# Dokploy API — проверенный справочник

Все вызовы: `<url>/api/<endpoint>`, где `<url>` и токен — из записи выбранного
сервера в реестре `~/.claude/nlab/dokploy-servers.md`.
Заголовки: `x-api-key: <api-key>` (+ `Content-Type: application/json` для POST).

GET-эндпоинты принимают параметры query-строкой, POST — JSON-телом.
Все payload'ы ниже проверены в бою (июль 2026, Dokploy v0.25+).

## Обзор и проекты

```
GET  project.all                     # дерево: проекты → environments → compose/applications/БД со статусами
GET  project.one?projectId=<id>      # один проект; environments[0].environmentId нужен для compose.create
POST project.create                  # {"name": "...", "description": "..."} → {project: {projectId}, environment: {...}}
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
POST compose.create                  # {"name": "...", "environmentId": "...", "composeType": "docker-compose"} → {composeId, appName, ...}
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

Лог конкретного деплоя лежит на сервере по `logPath` — читать по SSH
(адрес — в servers.md): `ssh <ssh> "tail -100 '<logPath>'"`.

Рантайм-логи контейнеров (SSH, только чтение):

```bash
ssh <ssh> "docker ps -a --filter name=<appName>"   # appName из compose.one
ssh <ssh> "docker logs --tail 200 <container>"
```

## Applications (не-compose сервисы)

Симметрично compose: `application.one?applicationId=`, `application.create`,
`application.update`, `application.deploy`, `application.redeploy`,
`deployment.allByApplication?applicationId=`.

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
