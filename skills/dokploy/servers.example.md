# Реестр Dokploy-серверов (ШАБЛОН)

При первом подключении сервера скопируй этот файл в
`~/.claude/nlab/dokploy-servers.md` и заполни (не рядом со SKILL.md: папка скилла
версионная и очищается при обновлении плагина — реестр с ключами пропадёт). Один сервер = один раздел `##`. Первый в списке — дефолтный.

**`servers.md` содержит API-ключи: он остаётся локальным. Никогда не коммитить
в репозитории, не пересылать и не включать в шаринг скилла.**

## my-server (default)

- url: http://203.0.113.10:3000            # URL панели Dokploy
- api-key: CHANGE_ME                        # Dokploy UI → Settings → API/CLI → Generate
- ssh: root@203.0.113.10                    # опционально; только для чтения логов
- hostname: my-server                       # как сервер представляется (docker context, приглашение)
- wildcard-domain: example.com              # базовый домен, A-запись *.example.com → IP сервера; "нет", если домена нет
- github-provider-id: CHANGE_ME             # GET github.githubProviders → githubId; "не подключён", если пусто
- creds-dir: ~/Dokploy-services             # локальная папка, куда сохранять креды задеплоенных проектов
- notes: особенности сервера — объём RAM/swap, известные грабли, что на нём живёт
