#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less', '.html', '.mdx', '.md']);
const ignoreDirs = new Set(['node_modules', '.next', 'dist', 'dist-server', 'coverage', 'public', '.git', 'out', 'build', 'docs', 'dev', 'dev_backup']);

const replacements = [
  { name: 'text-default-700 -> text-default-700', re: /\btext-default-500\b/g, to: 'text-default-700' },
  { name: 'text-default-700 -> text-default-700', re: /\btext-black\b/g, to: 'text-default-700' },
  // inline style black -> var(--color-fg-default)
  { name: "style color 'black' -> var(...)", re: /:\s*['\"]black['\"]/g, to: ": 'var(--color-fg-default)'" },
  { name: 'color: var(--color-fg-default) -> color: var(...)', re: /color\s*:\s*black\b/gi, to: 'color: var(--color-fg-default)' },
  // CSS hex black in color declarations (conservative): replace only when 'color' appears near
  { name: '#000/#000000 in color declarations', re: /color\s*:\s*(?:#000\b|#000000\b)/gi, to: 'color: var(--color-fg-default)' }
];

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (ignoreDirs.has(ent.name)) continue;
      walk(path.join(dir, ent.name), results);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (!exts.has(ext)) continue;
      results.push(path.join(dir, ent.name));
    }
  }
  return results;
}

function applyToFile(filePath) {
  let changed = false;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const r of replacements) {
    content = content.replace(r.re, r.to);
  }
  if (content !== original) {
    const bak = filePath + '.bak';
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, original, 'utf8');
    fs.writeFileSync(filePath, content, 'utf8');
    changed = true;
    console.log(`Updated: ${filePath}`);
  }
  return changed;
}

function main() {
  console.log('Applying conservative no-black replacements across repo (backups *.bak will be created)');
  const files = walk(ROOT);
  let count = 0;
  for (const f of files) {
    try {
      if (applyToFile(f)) count++;
    } catch (err) {
      // ignore
    }
  }
  console.log(`Done. Files modified: ${count}`);
}

main();
