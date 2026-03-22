#!/usr/bin/env python3
"""
Генератор главной страницы летописи для GitHub Pages.
Создает index.html с списком записей из папки archive/.
"""

import os
import re
from datetime import datetime
from pathlib import Path

ARCHIVE_DIR = Path("archive")
OUTPUT_FILE = Path("index.html")

def get_entries():
    """Собирает все .md файлы из archive/YYYY/MM/DD.md"""
    entries = []
    for year_dir in sorted(ARCHIVE_DIR.iterdir(), reverse=True):
        if not year_dir.is_dir():
            continue
        for month_dir in sorted(year_dir.iterdir(), reverse=True):
            if not month_dir.is_dir():
                continue
            for md_file in sorted(month_dir.glob("*.md"), reverse=True):
                # Извлекаем дату из пути: archive/2026/03/22.md
                date_str = f"{year_dir.name}-{month_dir.name}-{md_file.stem}"
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                except ValueError:
                    continue
                # Читаем превью (первые 2-3 абзаца или 300 символов)
                content = md_file.read_text(encoding="utf-8")
                # Убираем заголовок "# Летопись..."
                lines = content.split("\n")
                preview_lines = []
                for line in lines:
                    if line.startswith("#"):
                        continue
                    if line.strip() == "" and preview_lines:
                        break
                    preview_lines.append(line)
                preview = " ".join(preview_lines[:3])[:300].strip()
                if not preview:
                    preview = "(пустая запись)"
                entries.append({
                    "date": date_obj,
                    "date_display": date_obj.strftime("%d %B %Y года"),
                    "path": md_file.relative_to(Path(".")),
                    "preview": preview + "..."
                })
    return sorted(entries, key=lambda x: x["date"], reverse=True)

def generate_html(entries):
    """Генерирует HTML страницу"""
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Летопись Убежища 92</title>
  <style>
    :root {{
      --term-green: #33ff00;
      --term-cyan: #00ffff;
      --term-yellow: #ffff00;
      --bg-dark: #0a0a0a;
      --bg-panel: #111;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      padding: 0;
      background-color: var(--bg-dark);
      color: var(--term-green);
      font-family: "Courier New", monospace;
      line-height: 1.6;
    }}
    .container {{
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }}
    header {{
      border-bottom: 2px solid var(--term-green);
      padding-bottom: 15px;
      margin-bottom: 30px;
    }}
    h1 {{
      margin: 0;
      font-size: 2rem;
      color: var(--term-green);
      text-shadow: 0 0 5px var(--term-green);
    }}
    .subtitle {{
      color: var(--term-cyan);
      font-size: 1rem;
      margin-top: 5px;
    }}
    .entry {{
      background: var(--bg-panel);
      border-left: 4px solid var(--term-green);
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }}
    .entry-date {{
      color: var(--term-cyan);
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 8px;
    }}
    .entry-preview {{
      opacity: 0.9;
      margin: 0;
    }}
    .read-more {{
      display: inline-block;
      margin-top: 10px;
      color: var(--term-yellow);
      text-decoration: none;
    }}
    .read-more:hover {{
      text-decoration: underline;
    }}
    footer {{
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px dashed var(--term-green);
      color: #666;
      font-size: 0.9rem;
    }}
    .full-archive {{
      display: inline-block;
      margin-top: 20px;
      color: var(--term-cyan);
      text-decoration: none;
      border: 1px solid var(--term-cyan);
      padding: 8px 15px;
      border-radius: 4px;
    }}
    .full-archive:hover {{
      background: rgba(0, 255, 255, 0.1);
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Летопись Убежища 92</h1>
      <div class="subtitle">Дневник жизни нашего убежища в постапокалиптическом мире</div>
    </header>

    <h2 style="color: var(--term-yellow);">Последние записи</h2>
"""
    for entry in entries:
        html += f"""
    <article class="entry">
      <div class="entry-date">{entry['date_display']}</div>
      <p class="entry-preview">{entry['preview']}</p>
      <a class="read-more" href="{entry['path']}">→ Читать далее</a>
    </article>
"""
    html += f"""
    <a class="full-archive" href="archive/">→ Полный архив (все записи)</a>

    <footer>
      <p>Летописец: Смотритель Артем | Начато 19 марта 2026 года</p>
    </footer>
  </div>
</body>
</html>"""
    return html

def main():
    entries = get_entries()
    if not entries:
        print("Ошибка: не найдено записей в папке archive/")
        return
    html = generate_html(entries)
    OUTPUT_FILE.write_text(html, encoding="utf-8")
    print(f"✓ Сгенерировано {OUTPUT_FILE} ({len(entries)} записей)")

if __name__ == "__main__":
    main()
