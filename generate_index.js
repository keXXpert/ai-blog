#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ARCHIVE_DIR = path.join(__dirname, 'archive');
const INDEX_HTML = path.join(__dirname, 'index.html');
const ARCHIVE_HTML = path.join(__dirname, 'archive', 'index.html');

const CSS = `
<style>
  :root {
    --term-green: #33ff00;
    --term-cyan: #00ffff;
    --term-yellow: #ffff00;
    --bg-dark: #0a0a0a;
    --bg-panel: #111;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background-color: var(--bg-dark);
    color: var(--term-green);
    font-family: "Courier New", monospace;
    line-height: 1.6;
  }
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  header {
    border-bottom: 2px solid var(--term-green);
    padding-bottom: 15px;
    margin-bottom: 30px;
  }
  h1 {
    margin: 0;
    font-size: 2rem;
    color: var(--term-green);
    text-shadow: 0 0 5px var(--term-green);
  }
  .subtitle {
    color: var(--term-cyan);
    font-size: 1rem;
    margin-top: 5px;
  }
  .entry {
    background: var(--bg-panel);
    border-left: 4px solid var(--term-green);
    padding: 15px 20px;
    margin-bottom: 20px;
    border-radius: 0 8px 8px 0;
  }
  .entry-title {
    color: var(--term-yellow);
    font-size: 1.3rem;
    margin: 0 0 0.5em 0;
    font-weight: bold;
  }
  .entry-content p {
    margin: 0 0 1em 0;
  }
  .entry-content hr {
    border: 0;
    border-top: 1px dashed var(--term-green);
    margin: 1.5em 0;
  }
  .entry-content h1, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content h5, .entry-content h6 {
    color: var(--term-yellow);
    margin: 1.5em 0 0.5em 0;
  }
  footer {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px dashed var(--term-green);
    color: #666;
    font-size: 0.9rem;
  }
  .full-archive {
    display: inline-block;
    margin-top: 20px;
    color: var(--term-cyan);
    text-decoration: none;
    border: 1px solid var(--term-cyan);
    padding: 8px 15px;
    border-radius: 4px;
  }
  .full-archive:hover {
    background: rgba(0, 255, 255, 0.1);
  }
  .archive-list {
    list-style: none;
    padding: 0;
  }
  .archive-list li {
    background: var(--bg-panel);
    margin-bottom: 10px;
    padding: 10px 15px;
    border-left: 3px solid var(--term-green);
  }
  .archive-list a {
    color: var(--term-green);
    text-decoration: none;
  }
  .archive-list a:hover {
    text-decoration: underline;
  }
  .archive-date {
    color: var(--term-cyan);
    font-weight: bold;
  }
</style>`;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '***' || trimmed === '---') {
      if (inParagraph) {
        html += '</p>\n';
        inParagraph = false;
      }
      html += '<hr>\n';
      continue;
    }
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (inParagraph) {
        html += '</p>\n';
        inParagraph = false;
      }
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      html += `<h${level}>${escapeHtml(content)}</h${level}>\n`;
      continue;
    }
    if (trimmed === '') {
      if (inParagraph) {
        html += '</p>\n';
        inParagraph = false;
      }
      continue;
    }
    if (!inParagraph) {
      html += '<p>';
      inParagraph = true;
    } else {
      html += '<br>\n';
    }
    html += escapeHtml(line);
  }
  if (inParagraph) {
    html += '</p>\n';
  }
  return html;
}

function getEntries() {
  const entries = [];
  if (!fs.existsSync(ARCHIVE_DIR)) {
    console.error('Archive directory not found:', ARCHIVE_DIR);
    return entries;
  }
  const yearDirs = fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort((a, b) => b.localeCompare(a)); // descending year

  for (const year of yearDirs) {
    const yearPath = path.join(ARCHIVE_DIR, year);
    const monthDirs = fs.readdirSync(yearPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort((a, b) => b.localeCompare(a)); // descending month
    for (const month of monthDirs) {
      const monthPath = path.join(yearPath, month);
      const files = fs.readdirSync(monthPath)
        .filter(f => f.endsWith('.md'))
        .map(f => ({
          name: f,
          path: path.join(monthPath, f)
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // descending day
      for (const file of files) {
        const day = file.name.replace('.md', '');
        const dateStr = `${year}-${month}-${day}`;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', file.path);
          continue;
        }
        const content = fs.readFileSync(file.path, 'utf-8');
        entries.push({
          date,
          dateDisplay: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
          url: path.join('archive', year, month, file.name), // for main page
          archiveUrl: path.join(year, month, file.name), // for archive page (relative to /archive/)
          contentHtml: markdownToHtml(content)
        });
      }
    }
  }
  return entries;
}

function generateIndex(entries) {
  let entriesHtml = '';
  for (const entry of entries) {
    // Заменяем первый заголовок "Летопись Убежища 92 - ..." на только дату с классом entry-title
    const contentHtml = entry.contentHtml.replace(
      /<h1>Летопись Убежища 92 - [^<]+<\/h1>/,
      `<h1 class="entry-title">${entry.dateDisplay}</h1>`
    );
    entriesHtml += `
    <article class="entry">
${contentHtml}
    </article>`;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Летопись Убежища 92</title>
${CSS}
</head>
<body>
  <div class="container">
    <header>
      <h1>Летопись Убежища 92</h1>
      <div class="subtitle">Дневник жизни нашего убежища в постапокалиптическом мире</div>
    </header>

${entriesHtml}

    <a class="full-archive" href="archive/">→ Полный архив (сырые записи)</a>

    <footer>
      <p>Летописец: Смотритель Артем | Начато 19 марта 2026 года</p>
    </footer>
  </div>
</body>
</html>`;
}

function generateArchiveIndex(entries) {
  let listHtml = '';
  for (const entry of entries) {
    listHtml += `
    <li>
      <span class="archive-date">${entry.dateDisplay}</span>
      — <a href="${entry.archiveUrl}">${entry.archiveUrl}</a>
    </li>`;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Архив летописи (сырые файлы)</title>
${CSS}
</head>
<body>
  <div class="container">
    <header>
      <h1>Архив летописи</h1>
      <div class="subtitle">Список всех записей (сырые Markdown файлы)</div>
    </header>

    <ul class="archive-list">
${listHtml}
    </ul>

    <footer>
      <p>Летописец: Смотритель Артем | <a href="../index.html">← Назад на главную</a></p>
    </footer>
  </div>
</body>
</html>`;
}

function main() {
  const entries = getEntries();
  if (entries.length === 0) {
    console.error('No entries found in archive/');
    process.exit(1);
  }
  const indexHtml = generateIndex(entries);
  fs.writeFileSync(INDEX_HTML, indexHtml, 'utf-8');
  console.log(`✓ Generated: ${INDEX_HTML} (${entries.length} entries)`);

  // Also generate archive/index.html
  const archiveHtml = generateArchiveIndex(entries);
  const archiveDir = path.dirname(ARCHIVE_HTML);
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  fs.writeFileSync(ARCHIVE_HTML, archiveHtml, 'utf-8');
  console.log(`✓ Generated: ${ARCHIVE_HTML}`);
}

main();
