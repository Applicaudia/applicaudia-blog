import matter from 'gray-matter';

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string;
}

// Get all posts from markdown files
export async function getAllPosts(): Promise<Post[]> {
  const modules = import.meta.glob('/content/posts/**/*.md', { query: '?raw', import: 'default' });

  const posts: Post[] = [];

  for (const path in modules) {
    const raw = await modules[path]() as string;
    const { data, content } = matter(raw);

    // Extract slug from path
    const slug = path.replace('/content/posts/', '').replace('.md', '');

    posts.push({
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      excerpt: data.excerpt || '',
      tags: data.tags || [],
      content,
    });
  }

  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const modules = import.meta.glob('/content/posts/**/*.md', { query: '?raw', import: 'default' });

  const path = `/content/posts/${slug}.md`;

  if (!(path in modules)) {
    return null;
  }

  const raw = await modules[path]() as string;
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().split('T')[0],
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    content,
  };
}

// Parse front-matter from markdown content
export function parseFrontMatter(content: string) {
  return matter(content);
}
