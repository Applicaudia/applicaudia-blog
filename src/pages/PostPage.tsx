import { useParams, Link } from 'react-router-dom';
import { getPostBySlug } from '../utils/markdown';
import BlogPost from '../components/BlogPost';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : null;

  return (
    <div className="container">
      <header className="app-header">
        <nav className="blog-nav">
          <Link to="/blog/">← Back to Blog</Link>
        </nav>
      </header>

      <div className="blog-content">
        {!post ? (
          <div className="error">
            <p>Post not found.</p>
            <Link to="/blog/">← Back to Blog</Link>
          </div>
        ) : (
          <BlogPost post={post} />
        )}
      </div>
    </div>
  );
}
