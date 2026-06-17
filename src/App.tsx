import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BlogIndex from './pages/BlogIndex';
import PostPage from './pages/PostPage';
import './App.css';

function App() {
  return (
    <Router basename="/blog">
      <Routes>
        <Route path="/" element={<BlogIndex />} />
        <Route path="/:slug" element={<PostPage />} />
      </Routes>
    </Router>
  );
}

export default App;
