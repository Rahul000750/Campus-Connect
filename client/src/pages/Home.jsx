import { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const { data } = await api.get('/posts');
      setPosts(data);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not load posts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPost(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setErr('');
    try {
      await api.post('/post', { text: text.trim() });
      setText('');
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not create post');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <h1 className="h4 mb-3">Feed</h1>
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={createPost}>
            {err && <div className="alert alert-danger py-2">{err}</div>}
            <label className="form-label">New post</label>
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder="What is on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={posting}>
              {posting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
      {loading && <p className="text-muted">Loading posts...</p>}
      {!loading && posts.length === 0 && <p className="text-muted">No posts yet. Be the first to post!</p>}
      {posts.map((p) => (
        <PostCard key={p._id} post={p} onUpdate={load} />
      ))}
    </div>
  );
}
