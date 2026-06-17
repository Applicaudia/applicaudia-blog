import { spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite plugin: converts diagram sources in markdown posts to static inline SVG
 * at build/serve time. Zero runtime diagram libraries ship to the client.
 *
 * Owns the custom `?post` query (see src/utils/markdown.ts glob). Replaces:
 *   - fenced code with lang mermaid|plantuml|puml  -> inline <svg>
 *   - image refs to *.drawio / *.svg               -> inline <svg>
 *
 * All paths/external imports are resolved lazily so nothing runs at config
 * bundle time. Converted SVG is cached on disk keyed by content hash.
 */

const CACHE_VERSION = 'v1';
const FENCE_RE = /```([A-Za-z0-9_-]+)\r?\n([\s\S]*?)```/g;
const IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function cacheDir(): string {
  return resolve(process.cwd(), '.diagram-cache');
}
function sha(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 24);
}
function cacheGet(key: string): string | null {
  const p = resolve(cacheDir(), key + '.svg');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}
function cacheSet(key: string, svg: string): void {
  if (!existsSync(cacheDir())) mkdirSync(cacheDir(), { recursive: true });
  writeFileSync(resolve(cacheDir(), key + '.svg'), svg);
}

function ensureCacheDir(): string {
  const d = cacheDir();
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  return d;
}

function renderMermaid(src: string): Promise<string> {
  return new Promise((resolveP, reject) => {
    const mmdcBin = fileURLToPath(new URL('node_modules/.bin/mmdc', import.meta.url));
    const dir = ensureCacheDir();
    const inp = resolve(dir, `mmd-${sha(src)}.mmd`);
    const out = resolve(dir, `mmd-${sha(src)}.svg`);
    writeFileSync(inp, src);
    const puppeteerCfg = fileURLToPath(new URL('puppeteer-config.json', import.meta.url));
    const args = ['-i', inp, '-o', out, '-q', '-b', 'transparent'];
    if (existsSync(puppeteerCfg)) args.push('-p', puppeteerCfg);
    const child = spawn(mmdcBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error('mmdc exit ' + code + ': ' + err));
      if (!existsSync(out)) return reject(new Error('mmdc produced no output'));
      resolveP(readFileSync(out, 'utf8'));
    });
  });
}

function renderPlantuml(src: string): Promise<string> {
  return new Promise((resolveP, reject) => {
    const jar = resolve(process.cwd(), 'plantuml.jar');
    const child = spawn('java', ['-jar', jar, '-tsvg', '-pipe'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error('plantuml exit ' + code + ': ' + err));
      resolveP(out);
    });
    child.stdin.write(src);
    child.stdin.end();
  });
}

async function convert(kind: string, src: string): Promise<string> {
  switch (kind) {
    case 'mermaid': return renderMermaid(src);
    case 'plantuml':
    case 'puml': return renderPlantuml(src);
    case 'svg': return src;
  }
  throw new Error('unknown kind ' + kind);
}

async function cachedConvert(kind: string, src: string): Promise<string> {
  const key = `${CACHE_VERSION}-${kind}-${sha(src)}`;
  const hit = cacheGet(key);
  if (hit) return hit;
  let svg = await convert(kind, src);
  // Strip XML processing instructions (e.g. plantuml's <?plantuml ?>) so they
  // don't leak as text nodes after rehype-raw parses the inline SVG.
  svg = svg.replace(/^\s*<\?[\s\S]*?\?>\s*/, '');
  cacheSet(key, svg);
  return svg;
}

async function processMarkdown(md: string, mdPath: string, addWatch: (f: string) => void): Promise<string> {
  type Job = { start: number; end: number; svg: Promise<string> };
  const jobs: Job[] = [];
  let m: RegExpExecArray | null;

  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(md))) {
    const lang = m[1].toLowerCase();
    if (lang === 'mermaid' || lang === 'plantuml' || lang === 'puml') {
      const start = m.index;
      const end = m.index + m[0].length;
      jobs.push({ start, end, svg: cachedConvert(lang, m[2]) });
    }
  }

  IMG_RE.lastIndex = 0;
  while ((m = IMG_RE.exec(md))) {
    const url = m[2];
    const clean = url.toLowerCase().split('?')[0].split('#')[0];
    // draw.io diagrams are authored by exporting to SVG in the draw.io app,
    // then referenced as .svg (pure-node .drawio rendering is unreliable).
    if (!clean.endsWith('.svg')) continue;
    const ext = 'svg';
    const abs = isAbsolute(url) ? url : resolve(dirname(mdPath), url);
    if (!existsSync(abs)) continue;
    addWatch(abs);
    jobs.push({ start: m.index, end: m.index + m[0].length, svg: cachedConvert(ext, readFileSync(abs, 'utf8')) });
  }

  jobs.sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const job of jobs) {
    // Fail loud: a diagram conversion error must break the build (and show in
    // the vite error overlay in dev) rather than silently ship raw markdown.
    const svg = await job.svg;
    out += md.slice(cursor, job.start) + '\n\n' + svg + '\n\n';
    cursor = job.end;
  }
  out += md.slice(cursor);
  return out;
}

export default function diagramsPlugin() {
  return {
    name: 'blog-diagrams',
    async load(this: { addWatchFile: (f: string) => void }, id: string) {
      // Robust across dev/build: match any .md module carrying our ?post query
      // (vite may append extra query params like &import in dev).
      if (!id.includes('?post')) return;
      const mdPath = id.split('?')[0];
      if (!mdPath.endsWith('.md')) return;
      if (!existsSync(mdPath)) return;
      const raw = readFileSync(mdPath, 'utf8');
      const converted = await processMarkdown(raw, mdPath, (f) => this.addWatchFile(f));
      return `export default ${JSON.stringify(converted)}`;
    }
  };
}
