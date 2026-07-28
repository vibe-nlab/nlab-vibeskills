# nlab-vibeskills — приватный реестр скиллов NeuroLab

Репозиторий одновременно является **маркетплейсом плагинов Claude Code** и
самим плагином `nlab`. Все скиллы ставятся одним пакетом и вызываются
с префиксом: `/nlab:project-start`, `/nlab:prototype`, `/nlab:code-design`,
`/nlab:design-ui`, `/nlab:dokploy-prep`, `/nlab:dokploy`. Начало любого нового проекта — `/nlab:project-start`.

Репозиторий приватный. Claude Code клонирует его обычным `git` под вашей
учётной записью — доступ к репо нужен, ничего публиковать не требуется.

## Установка

Требование: доступ на чтение к `sber-nlab/nlab-vibeskills` и настроенный
git (`gh auth login` или SSH-ключ).

В Claude Code:

```
/plugin marketplace add sber-nlab/nlab-vibeskills
/plugin install nlab@nlab-vibeskills
```

Проверить: `/plugin` → плагин `nlab` в списке установленных; скиллы
появятся как `/nlab:<имя>`.

Если по HTTPS не проходит авторизация, добавьте маркетплейс по SSH:

```
/plugin marketplace add git@github.com:sber-nlab/nlab-vibeskills.git
```

### Обновление

```
/plugin marketplace update nlab-vibeskills
```

### Удаление

```
/plugin uninstall nlab@nlab-vibeskills
```

## Состав пакета

| Скилл | Вызов | Этап | Назначение |
|---|---|---|---|
| `project-start` | `/nlab:project-start` | discovery | старт проекта: уровень подачи, Discovery → `intent.md` и `spec/SPEC.md`, каркас, стек, доступы, `PLAN.html` для человека |
| `prototype` | `/nlab:prototype` | discovery | кликабельный HTML-макет интерфейса: снимает требования на нём, на выходе `MOCK.html`, критерии и `feature-list.json` |
| `code-design` | `/nlab:code-design` | design | спецификация (SDD) в `spec/` и архитектура бэкенда (DDD) в `arch/`: единый язык, слои, ADR |
| `design-ui` | `/nlab:design-ui` | design (UI) | дизайн-система NeuroLab поверх shadcn/ui (Montserrat + 112.5%, графитовая тёмная тема) |
| `dokploy-prep` | `/nlab:dokploy-prep` | prep | подготовка репозитория к деплою: `docker-compose.dokploy.yml`, `.env.dokploy.example`, `DEPLOY_DOKPLOY.md` |
| `dokploy` | `/nlab:dokploy` | deploy | деплой и эксплуатация сервисов на Dokploy-серверах через API |

Внешние зависимости, которые ставятся отдельно (не входят в пакет):

- `shadcn` — официальный скилл shadcn/ui, обязателен для `/nlab:design-ui`.

## Что ещё в репозитории

| Путь | Назначение |
|---|---|
| `.claude-plugin/` | манифесты плагина и маркетплейса |
| `skills/` | сами скиллы (каждый — папка с `SKILL.md`) |
| `skills-doc/` | как писать скиллы: `skill_template.md`, `skill_design_best_practices.md` и `validate_skills.py` |

Каждый скилл самодостаточен: всё, что ему нужно, лежит в его же папке —
`assets/` (копируется в проект пользователя) и `references/` (только
чтение). Корень репозитория остаётся чистым. Например, правила процесса
`AGENTS.md`, конвенции стека `project_setup_best_practices.md` и стартовый
фронтенд-темплейт живут внутри `skills/project-start/`.

## Как добавить скилл в пакет

1. Создайте `skills/<имя>/SKILL.md` по шаблону `skills-doc/skill_template.md`.
2. Поле `name:` во frontmatter должно совпадать с именем папки — оно же
   станет командой `/nlab:<имя>`.
3. Проверьте перед коммитом:

   ```bash
   python3 skills-doc/validate_skills.py   # frontmatter, имена, зависимости
   claude plugin validate . --strict       # манифесты плагина
   ```

   Нужны оба: `claude plugin validate` разбирает только манифесты и не
   заглядывает в YAML внутри `SKILL.md` — сломанный frontmatter он пропустит.
4. Поднимите `version` в `.claude-plugin/plugin.json` и
   `.claude-plugin/marketplace.json`, закоммитьте и запушьте.
5. У пользователей: `/plugin marketplace update nlab-vibeskills`.
