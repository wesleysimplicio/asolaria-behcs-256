#!/usr/bin/env node
/**
 * memory-sync-check.mjs — Verify MEMORY.md index is in sync with on-disk memory files.
 *
 * Read-only by default. Validates:
 *   - Every link in MEMORY.md resolves to an existing file in the same dir.
 *   - Every linked file has frontmatter with `name`, `description`, `type`.
 *   - `type` is one of {user, feedback, project, reference}.
 *   - No orphan .md files in the dir (excluding MEMORY.md) unreferenced by the index.
 *
 * Usage:
 *   node memory-sync-check.mjs                                 # report only (default)
 *   node memory-sync-check.mjs --fix-missing-frontmatter
 *   node memory-sync-check.mjs --propose-orphan-entries
 *   node memory-sync-check.mjs --missing-files-action <skip|remove-from-index>
 *
 * Output:
 *   {
 *     missing_files: [string],
 *     malformed_frontmatter: [{file, reason}],
 *     orphans: [string],
 *     ok_count: number,
 *     proposed_orphan_entries?: [{file, section, line}],
 *     proposed_missing_diff?: [{file, remove_line}]
 *   }
 *
 * Notes:
 *   --propose-orphan-entries and --missing-files-action=remove-from-index NEVER
 *   modify MEMORY.md. They only emit candidate lines / removal hints to stdout
 *   so the operator can copy-paste into MEMORY.md manually.
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MEMORY_DIR = 'C:/Users/acer/.claude/projects/C--/memory';
const INDEX_FILE = 'MEMORY.md';
const VALID_TYPES = new Set(['user', 'feedback', 'project', 'reference']);

// Map type -> MEMORY.md section header (must match the literal headers in the file).
const TYPE_TO_SECTION = {
  user: '## User',
  project: '## Project',
  feedback: '## Feedback',
  reference: '## Reference',
};

const argv = process.argv.slice(2);
const args = new Set(argv);
const FIX_MISSING = args.has('--fix-missing-frontmatter');
const PROPOSE_ORPHANS = args.has('--propose-orphan-entries');

// Parse --missing-files-action <skip|remove-from-index>
function parseMissingAction(list) {
  const i = list.indexOf('--missing-files-action');
  if (i === -1) return 'skip';
  const v = list[i + 1];
  if (v !== 'skip' && v !== 'remove-from-index') {
    console.error(`--missing-files-action expects "skip" or "remove-from-index" (got ${JSON.stringify(v)})`);
    process.exit(2);
  }
  return v;
}
const MISSING_ACTION = parseMissingAction(argv);

const indexPath = path.join(MEMORY_DIR, INDEX_FILE);
if (!fs.existsSync(indexPath)) {
  console.error(`MEMORY.md not found at ${indexPath}`);
  process.exit(2);
}

// Pattern: `- [title](filename.md) — description`
// Permissive on the dash (em-dash, en-dash, hyphen) and on whitespace.
const LINK_RE = /^\s*-\s*\[[^\]]+\]\(([^)]+\.md)\)\s*[—–-]\s*(.*)$/u;

function parseIndex(text) {
  const refs = [];
  for (const line of text.split(/\r?\n/)) {
    const m = LINK_RE.exec(line);
    if (!m) continue;
    const filename = m[1].trim();
    // Skip absolute or non-local references just in case
    if (filename.includes('/') || filename.includes('\\')) continue;
    refs.push({ filename, description: m[2].trim(), raw: line });
  }
  return refs;
}

function parseFrontmatter(text) {
  // Frontmatter must start at the very top: ---\n...\n---
  if (!text.startsWith('---')) return { ok: false, reason: 'no frontmatter block (missing leading ---)' };
  const rest = text.slice(3);
  // Allow optional leading newline after opening ---
  const newlineIdx = rest.search(/\r?\n/);
  if (newlineIdx === -1) return { ok: false, reason: 'malformed frontmatter (no newline after opening ---)' };
  const body = rest.slice(newlineIdx + (rest[newlineIdx] === '\r' ? 2 : 1));
  const closeMatch = body.match(/\r?\n---\s*(\r?\n|$)/);
  if (!closeMatch) return { ok: false, reason: 'malformed frontmatter (no closing ---)' };
  const fmBlock = body.slice(0, closeMatch.index);
  const fields = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const colon = t.indexOf(':');
    if (colon === -1) continue;
    const key = t.slice(0, colon).trim();
    let val = t.slice(colon + 1).trim();
    // strip surrounding quotes if any
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fields[key] = val;
  }
  return { ok: true, fields };
}

function buildMinimalFrontmatter(filename) {
  const name = filename.replace(/\.md$/i, '');
  return `---\nname: ${name}\ndescription: TODO\ntype: project\n---\n\n`;
}

const indexText = fs.readFileSync(indexPath, 'utf8');
const refs = parseIndex(indexText);

const missing_files = [];
const malformed_frontmatter = [];
let ok_count = 0;
let fixed = 0;

const referencedSet = new Set();

for (const { filename } of refs) {
  referencedSet.add(filename);
  const filePath = path.join(MEMORY_DIR, filename);
  if (!fs.existsSync(filePath)) {
    missing_files.push(filename);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(text);

  if (!fm.ok) {
    if (FIX_MISSING) {
      const patched = buildMinimalFrontmatter(filename) + text;
      fs.writeFileSync(filePath, patched, 'utf8');
      fixed += 1;
      // Re-validate after patch
      const fm2 = parseFrontmatter(patched);
      if (fm2.ok && fm2.fields.name && fm2.fields.description && fm2.fields.type
          && VALID_TYPES.has(fm2.fields.type)) {
        ok_count += 1;
        continue;
      }
      malformed_frontmatter.push({ file: filename, reason: `fix attempted but still invalid` });
      continue;
    }
    malformed_frontmatter.push({ file: filename, reason: fm.reason });
    continue;
  }

  const reasons = [];
  if (!fm.fields.name) reasons.push('missing field: name');
  if (!fm.fields.description) reasons.push('missing field: description');
  if (!fm.fields.type) reasons.push('missing field: type');
  if (fm.fields.type && !VALID_TYPES.has(fm.fields.type)) {
    reasons.push(`invalid type: ${JSON.stringify(fm.fields.type)} (must be one of ${[...VALID_TYPES].join(', ')})`);
  }
  if (reasons.length) {
    malformed_frontmatter.push({ file: filename, reason: reasons.join('; ') });
  } else {
    ok_count += 1;
  }
}

// Orphan scan: any .md in dir that isn't MEMORY.md and isn't referenced.
const orphans = [];
for (const entry of fs.readdirSync(MEMORY_DIR)) {
  if (!entry.toLowerCase().endsWith('.md')) continue;
  if (entry === INDEX_FILE) continue;
  if (!referencedSet.has(entry)) orphans.push(entry);
}

const report = {
  missing_files,
  malformed_frontmatter,
  orphans,
  ok_count,
};

if (FIX_MISSING) {
  report.fixed_count = fixed;
}

// --- Auto-propose orphan entries (opt-in, stdout-only, MEMORY.md untouched) ---
if (PROPOSE_ORPHANS) {
  const proposed = [];
  for (const filename of orphans) {
    const filePath = path.join(MEMORY_DIR, filename);
    let text;
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      proposed.push({ file: filename, section: null, line: null, reason: `read failed: ${e.message}` });
      continue;
    }
    const fm = parseFrontmatter(text);
    if (!fm.ok) {
      proposed.push({ file: filename, section: null, line: null, reason: `frontmatter invalid: ${fm.reason}` });
      continue;
    }
    const { name, description, type } = fm.fields;
    const reasons = [];
    if (!name) reasons.push('missing name');
    if (!description) reasons.push('missing description');
    if (!type) reasons.push('missing type');
    if (type && !VALID_TYPES.has(type)) reasons.push(`invalid type: ${type}`);
    if (reasons.length) {
      proposed.push({ file: filename, section: null, line: null, reason: reasons.join('; ') });
      continue;
    }
    const section = TYPE_TO_SECTION[type];
    // Trim description to 150 chars (preserve word boundary if possible).
    let desc = description.trim();
    if (desc.length > 150) {
      const cut = desc.slice(0, 150);
      const lastSpace = cut.lastIndexOf(' ');
      desc = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
    }
    const line = `- [${filename}](${filename}) — ${desc}`;
    proposed.push({ file: filename, section, line });
  }
  report.proposed_orphan_entries = proposed;
}

// --- Missing-files-action: remove-from-index emits a manual diff hint ---
if (MISSING_ACTION === 'remove-from-index') {
  const proposed_diff = [];
  // Re-walk the index lines so we can return the exact line to remove.
  const indexLines = indexText.split(/\r?\n/);
  for (const filename of missing_files) {
    for (let i = 0; i < indexLines.length; i++) {
      const m = LINK_RE.exec(indexLines[i]);
      if (!m) continue;
      if (m[1].trim() === filename) {
        proposed_diff.push({
          file: filename,
          line_number: i + 1,
          remove_line: indexLines[i],
        });
      }
    }
  }
  report.proposed_missing_diff = proposed_diff;
  report.missing_files_action = 'remove-from-index';
} else {
  report.missing_files_action = 'skip';
}

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
