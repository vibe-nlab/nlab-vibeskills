# /dokploy-prep — подготовка проекта к деплою на Dokploy

Скилл для Claude Code. Прогоняете свой репозиторий через него — Claude
подготовит проект к деплою на Dokploy: создаст `docker-compose.dokploy.yml`,
`.env.dokploy.example` и `DEPLOY_DOKPLOY.md` по конвенциям, проверит
Dockerfile, `.dockerignore` и healthcheck'и. Дальше вы просто отдаёте ссылку
на репозиторий тому, кто хостит, — и он деплоит без доработок.

## Установка

1. Скопируйте папку целиком в скиллы Claude Code:

   ```bash
   cp -r dokploy-prep ~/.claude/skills/dokploy-prep
   ```

2. Добавьте в `~/.claude/CLAUDE.md` (создайте файл, если его нет):

   ```markdown
   # dokploy-prep
   - **dokploy-prep** (`~/.claude/skills/dokploy-prep/SKILL.md`) — подготовка
     репозитория к деплою на Dokploy (compose/env/доки по конвенциям).
     Trigger: `/dokploy-prep`
   When the user types `/dokploy-prep`, invoke the Skill tool with
   `skill: "dokploy-prep"` before doing anything else.
   ```

## Использование

1. Откройте Claude Code в корне вашего проекта.
2. Наберите `/dokploy-prep`.
3. Отвечайте на вопросы (какие сервисы, что наружу, какая БД) — Claude
   составит план и создаст файлы.
4. Проверьте результат, закоммитьте и запушьте (Claude предложит сделать
   это сам).
5. Отправьте ссылку на репозиторий тому, кто хостит. Реальные домены и
   секреты он задаст у себя при деплое — в репо остаются только
   плейсхолдеры и `CHANGE_ME`-значения.

## Что появится в репозитории

| Файл | Назначение |
|---|---|
| `docker-compose.dokploy.yml` | стек для Dokploy (без Traefik-лейблов и хост-портов) |
| `.env.dokploy.example` | шаблон переменных окружения, без секретов |
| `DEPLOY_DOKPLOY.md` | гайд для деплоя: домены↔сервисы↔порты, обязательные env, проверка |

Секреты в репозиторий не попадают — следите, чтобы заполненные `.env`-файлы
оставались в `.gitignore` / `.dockerignore`.
