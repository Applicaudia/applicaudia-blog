import { getAllPosts } from '../utils/markdown';
import PostCard from '../components/PostCard';

export default function BlogIndex() {
  const posts = getAllPosts();

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
        {posts.length === 0 ? (
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
