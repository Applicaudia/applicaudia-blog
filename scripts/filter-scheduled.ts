// Build-time scheduling gate: physically excludes future-dated posts from the
// Vite build so their content never ships in the bundle. Dev server is unaffected
// (only wraps `bun run build`), so all posts remain visible locally.
//
// Usage: bun run scripts/filter-scheduled.ts pre   (before vite build)
//        bun run scripts/filter-scheduled.ts post  (after vite build, always)
import { readdir, readFile, mkdir, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const POSTS_DIR = path.resolve(import.meta.dir, '../content/posts');
const STAGING = path.resolve(import.meta.dir, '../.scheduled-staging'); // outside content/ → not globbed
const NOW = Date.now(); // build time; in CI = the weekly cron wall-clock

// Parse a front-matter `date: "YYYY-MM-DD"` line as UTC midnight.
// Returns null if absent/unparseable so such posts are left in place (never silently hidden).
function parseDateUTC(raw: string): number | null {
  const m = raw.match(/date:\s*"?(\d{4})-(\d{2})-(\d{2})"?/);
  if (!m) return null;
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
  return Number.isNaN(t) ? null : t;
}

async function pre() {
  if (existsSync(STAGING)) await rm(STAGING, { recursive: true, force: true });
  await mkdir(STAGING, { recursive: true });
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const moved: string[] = [];
  for (const f of files) {
    const abs = path.join(POSTS_DIR, f);
    const text = await readFile(abs, 'utf8');
    const d = parseDateUTC(text);
    if (d !== null && d > NOW) {
      await rename(abs, path.join(STAGING, f));
      moved.push(f);
    }
  }
  console.log(`filter-scheduled: excluded ${moved.length} future post(s): ${moved.join(', ') || 'none'}`);
}

async function post() {
  if (!existsSync(STAGING)) return;
  for (const f of await readdir(STAGING)) {
    await rename(path.join(STAGING, f), path.join(POSTS_DIR, f));
  }
  await rm(STAGING, { recursive: true, force: true });
  console.log('filter-scheduled: restored staged posts');
}

const mode = process.argv[2];
if (mode === 'pre') {
  await pre();
} else if (mode === 'post') {
  await post();
} else {
  throw new Error('usage: filter-scheduled.ts pre|post');
}
