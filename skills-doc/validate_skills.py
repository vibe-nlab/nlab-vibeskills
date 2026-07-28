#!/usr/bin/env python3
"""Проверка скиллов реестра перед коммитом.

`claude plugin validate` проверяет манифесты плагина и маркетплейса, но НЕ
разбирает YAML-frontmatter внутри SKILL.md. Незакавыченное двоеточие с
пробелом в description («каркас: AGENTS.md») делает скаляр вложенным
маппингом — скилл перестаёт загружаться, а validate при этом проходит.
Этот скрипт закрывает дыру.

Запуск из корня реестра:  python3 skills-doc/validate_skills.py
Код возврата 1, если есть ошибки.
"""

import pathlib
import re
import sys

try:
    import yaml
except ImportError:
    sys.exit("нужен pyyaml:  pip install pyyaml")

REQUIRED = ["name", "title", "description", "owner", "version", "status",
            "scope", "stage", "depends_on", "autonomy_level", "last_reviewed",
            "registry_url", "update_check"]
STATUSES = {"draft", "review", "published", "in-use", "deprecated"}
STAGES = {"discovery", "design", "prep", "deploy", "other"}

errors, names = [], {}
skills = sorted(pathlib.Path("skills").glob("*/SKILL.md"))
if not skills:
    sys.exit("не найдено ни одного skills/*/SKILL.md — запусти из корня реестра")

for f in skills:
    d = f.parent.name
    m = re.match(r"^---\n(.*?)\n---\n", f.read_text(), re.S)
    if not m:
        errors.append(f"{f}: нет YAML-frontmatter в начале файла")
        continue
    try:
        meta = yaml.safe_load(m.group(1))
    except yaml.YAMLError as e:
        first = str(e).splitlines()[0]
        errors.append(f"{f}: frontmatter не парсится — {first}\n"
                      f"    частая причина: двоеточие с пробелом в незакавыченном "
                      f"значении (пиши тире вместо «: »)")
        continue
    if not isinstance(meta, dict):
        errors.append(f"{f}: frontmatter не словарь")
        continue

    for key in REQUIRED:
        if key not in meta:
            errors.append(f"{f}: нет обязательного поля `{key}`")
    if meta.get("name") != d:
        errors.append(f"{f}: name `{meta.get('name')}` != имени папки `{d}` — "
                      f"команда /nlab:<имя> берётся из папки")
    names.setdefault(meta.get("name"), []).append(str(f))
    if meta.get("status") not in STATUSES:
        errors.append(f"{f}: status `{meta.get('status')}` не из {sorted(STATUSES)}")
    if meta.get("stage") not in STAGES:
        errors.append(f"{f}: stage `{meta.get('stage')}` не из {sorted(STAGES)}")
    if meta.get("status") == "draft":
        errors.append(f"{f}: status draft — такой скилл не должен уезжать в реестр")
    for dep in meta.get("depends_on") or []:
        if not (pathlib.Path("skills") / dep).is_dir() and dep != "shadcn":
            errors.append(f"{f}: depends_on `{dep}` — такого скилла нет в skills/")

for name, files in names.items():
    if len(files) > 1:
        errors.append(f"имя `{name}` занято дважды: {', '.join(files)}")

if errors:
    print("\n".join(f"✘ {e}" for e in errors))
    sys.exit(1)
print(f"✔ {len(skills)} скиллов: frontmatter валиден, имена совпадают с папками")
