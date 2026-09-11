# Реестр Dokploy-серверов (ШАБЛОН)

При первом подключении сервера скопируй этот файл в
`~/.claude/nlab/dokploy-servers.md` и заполни (не рядом со SKILL.md: папка скилла
версионная и очищается при обновлении плагина — реестр с ключами пропадёт). Один сервер = один раздел `##`. Первый в списке — дефолтный.

**`servers.md` содержит API-ключи: он остаётся локальным. Никогда не коммитить
в репозитории, не пересылать и не включать в шаринг скилла.**

## my-server (default)

- url: http://203.0.113.10:3000            # URL панели Dokploy
- api-key: CHANGE_ME                        # Dokploy UI → Settings → API/CLI → Generate; на сервере лаборатории — из Vault secret/users/<github-login>/dokploy
- ssh: root@203.0.113.10                    # опционально; только для чтения логов
- hostname: my-server                       # как сервер представляется (docker context, приглашение)
- wildcard-domain: example.com              # базовый домен, A-запись *.example.com → IP сервера; "нет", если домена нет
- github-provider-id: CHANGE_ME             # GET github.githubProviders → githubId; "не подключён", если пусто
- mlflow: https://mlflow.example.com        # общий трейсинг проекта; "нет", если не развёрнут
- llm-gateway: https://ai.example.com        # гейт LLM для серверов, где провайдеры закрыты по IP; "нет", если ходим напрямую
- s3-gateway: https://s3gate.example.com     # presigned-ссылки для агентов; ключи выдаёт владелец
- vault-provider: prod-vault                # Vault-провайдер в Dokploy для ${{vault...}}; "нет", если секреты значениями
- creds-dir: ~/Dokploy-services             # локальная папка, куда сохранять креды задеплоенных проектов
- проекты: infra / Nlab / agents / tools / research  # какие проекты-кластеры уже есть (projectId, environmentId) — новые сервисы кладём в них
- права аккаунта: owner                     # или перечислить, чего нельзя: удалять проекты, Traefik-файлы, SSH-ключи (если аккаунт не owner)
- egress: без ограничений                   # какие внешние API с сервера НЕ доступны — проверено из контейнера, не curl'ом (curl ловит 403 от WAF)
- notes: особенности сервера — объём RAM/swap, известные грабли, что на нём живёт
