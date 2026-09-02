/**
 * Generates dist/sitemap.xml for applicaudia.se/blog/ from post frontmatter.
 * Runs between `filter-scheduled pre` and `filter-scheduled post`, so
 * future-dated (staged-out) posts are excluded automatically.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const POSTS_DIR = join(import.meta.dir, '..', 'content', 'posts');
const DIST = join(import.meta.dir, '..', 'dist', 'sitemap.xml');
const BASE = 'https://applicaudia.se/blog';

const files = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

const urls: { loc: string; lastmod: string }[] = [{ loc: `${BASE}/`, lastmod: '' }];

for (const f of files) {
  const raw = readFileSync(join(POSTS_DIR, f), 'utf-8');
  const m = raw.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})['"]?/m);
  if (!m) {
    console.warn(`gen-sitemap: no date in ${f}, skipping`);
    continue;
  }
  urls.push({
    loc: `${BASE}/${f.replace(/\.md$/, '')}`,
    lastmod: m[1],
  });
}

const today = new Date().toISOString().slice(0, 10);
urls[0].lastmod = today;

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join('\n') +
  '\n</urlset>\n';

writeFileSync(DIST, xml);
console.log(`gen-sitemap: wrote ${urls.length} urls to dist/sitemap.xml`);
