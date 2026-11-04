#!/usr/bin/env node
/* Writes text.html, the plain reading copy (no scripts, no demos, no motion), from the generated index.html. Run after scripts/build.py. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let main = src.slice(src.indexOf('<main'), src.indexOf('</main>') + 7);
main = main.replace(/<!--demo-->[\s\S]*?<!--\/demo-->/g, '').replace(/<canvas[\s\S]*?<\/canvas>/g, '').replace(/\sdata-(reveal|depth|magnet)(="[^"]*")?/g, '').replace(/<dialog[\s\S]*?<\/dialog>/g, '');
main = main.replace(/<ul class="facts"[\s\S]*?<\/ul>/, '').replace(/<p class="muted small"[^>]*>Try it now[\s\S]*?<\/p>/, '');
const css = ':root{color-scheme:light dark;--bg:#fbfaf6;--ink:#1d2328;--muted:#55606a;--line:#d6d2c4;--accent:#2f6f5e;--s2:#ece9df}@media(prefers-color-scheme:dark){:root{--bg:#14181b;--ink:#e8ecef;--muted:#a4aeb6;--line:#34414a;--accent:#6fc3a8;--s2:#242c31}}' +
  'body{font:1.05rem/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);margin:0 auto;padding:1rem 1rem 4rem;max-width:62rem}a{color:var(--accent)}h1,h2,h3{line-height:1.15}.eyebrow{text-transform:uppercase;letter-spacing:.1em;font-size:.8rem;color:var(--accent)}' +
  '.tbl-wrap{overflow-x:auto}table{border-collapse:collapse;font-size:.85rem}th,td{border-top:1px solid var(--line);padding:.3rem .6rem;text-align:left;vertical-align:top}code,pre{background:var(--s2);border-radius:4px;padding:.1em .3em;font-size:.9em}pre{overflow-x:auto;padding:.8rem}.muted{color:var(--muted)}.sw{display:inline-block;width:1em;height:1em;border:1px solid var(--line);vertical-align:-.15em;margin-right:.3em}';
const out = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Murmur design language, text version</title>\n<meta name="description" content="Plain text version of the Murmur design language: no scripts, no demos.">\n<link rel="canonical" href="https://dhairyab0069.github.io/design-language/text.html">\n<style>${css}</style></head><body>\n<p><a href="index.html">Back to the live style guide</a> (sound, motion and theme controls). This copy has no scripts or motion. The canonical document is <a href="DESIGN-LANGUAGE.md">DESIGN-LANGUAGE.md</a>.</p>\n${main}\n</body></html>\n`;
fs.writeFileSync(path.join(root, 'text.html'), out);
console.log('wrote text.html (' + out.length + ' bytes)');
