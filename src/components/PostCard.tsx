import { Link } from 'react-router-dom';
import type { Post } from '../utils/markdown';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      <h2 className="post-card-title">
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <div className="post-card-meta">
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
      {post.excerpt && (
        <p className="post-card-excerpt">{post.excerpt}</p>
      )}
      <Link to={`/blog/${post.slug}`} className="post-card-link">
        Read more →
      </Link>
    </article>
  );
}
