import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { svgSchema } from '../utils/svg-sanitize-schema';
import { resolvePostImage } from '../utils/markdown';
import type { Post } from '../utils/markdown';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface BlogPostProps {
  post: Post;
}

export default function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="blog-post">
      <header className="blog-post-header">
        <h1>{post.title}</h1>
        <div className="blog-post-meta">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          {post.tags.length > 0 && (
            <span className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="post-tag">#{tag}</span>
              ))}
            </span>
          )}
        </div>
      </header>

      <div className="blog-post-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, svgSchema], rehypeHighlight, rehypeKatex]}
          components={{
            img: ({ src, alt }) =>
              typeof src === 'string' ? (
                <img
                  src={resolvePostImage(post.slug, src)}
                  alt={alt ?? ''}
                  loading="lazy"
                />
              ) : null,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
