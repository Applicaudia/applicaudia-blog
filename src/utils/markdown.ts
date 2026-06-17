export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string;
}

// Minimal front-matter parser (YAML subset): title, date, excerpt, tags.
// Avoids gray-matter's eval/require which is fragile in browser bundles.
function parseFrontMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { data: {}, content: raw };
  }
  const block = fmMatch[1];
  const content = fmMatch[2];
  const data: Record<string, unknown> = {};

  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val: unknown = m[2].trim();

    // Strip surrounding quotes
    if (typeof val === 'string' && /^".*"$/.test(val)) {
      val = val.slice(1, -1);
    }

    // Inline array: [a, b, c]
    const arrMatch = typeof val === 'string' ? val.match(/^\[(.*)\]$/) : null;
    if (arrMatch) {
      val = arrMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
    data[key] = val;
  }
  return { data, content };
}

// All posts are inlined at build time (eager). No runtime chunk fetch.
const modules = import.meta.glob('/content/posts/**/*.md', {
  query: '?post',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function buildPost(path: string, raw: string): Post {
  const { data, content } = parseFrontMatter(raw);
  const slug = path.replace('/content/posts/', '').replace(/\.md$/, '');
  const tags = Array.isArray(data.tags) ? (data.tags as string[]) : [];
  return {
    slug,
    title: (data.title as string) || 'Untitled',
    date: (data.date as string) || '1970-01-01',
    excerpt: (data.excerpt as string) || '',
    tags,
    content,
  };
}

// Get all posts, sorted newest first
export function getAllPosts(): Post[] {
  return Object.entries(modules)
    .map(([path, raw]) => buildPost(path, raw))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get a single post by slug
export function getPostBySlug(slug: string): Post | null {
  const path = `/content/posts/${slug}.md`;
  const raw = modules[path];
  if (!raw) return null;
  return buildPost(path, raw);
}
