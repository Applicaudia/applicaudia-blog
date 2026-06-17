import { useState, useEffect } from 'react';
import { getAllPosts, type Post } from '../utils/markdown';
import PostCard from '../components/PostCard';

export default function BlogIndex() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const allPosts = await getAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  return (
    <div className="container">
      <header className="app-header">
        <h1>Applicaudia Blog</h1>
        <p>Articles and insights on software, cybersecurity, and technology.</p>
        <nav className="blog-nav">
          <a href="/home/">← Back to Applicaudia</a>
        </nav>
      </header>

      <div className="blog-content">
        {loading ? (
          <p className="loading">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
