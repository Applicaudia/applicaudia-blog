import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostBySlug, type Post } from '../utils/markdown';
import BlogPost from '../components/BlogPost';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;

      try {
        const loadedPost = await getPostBySlug(slug);
        setPost(loadedPost);
      } catch (error) {
        console.error('Failed to load post:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  return (
    <div className="container">
      <header className="app-header">
        <nav className="blog-nav">
          <Link to="/blog/">← Back to Blog</Link>
        </nav>
      </header>

      <div className="blog-content">
        {loading ? (
          <p className="loading">Loading post...</p>
        ) : !post ? (
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
