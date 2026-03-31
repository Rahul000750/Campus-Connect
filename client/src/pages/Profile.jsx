import { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';

export default function Profile() {
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const [meRes, postsRes] = await Promise.all([api.get('/me'), api.get('/posts')]);
      setMe(meRes.data);
      const mine = postsRes.data.filter(
        (p) => String(p.author?._id || p.author) === String(meRes.data._id)
      );
      setPosts(mine);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="h4 mb-3">Profile</h1>
      {loading && <p className="text-muted">Loading...</p>}
      {err && <div className="alert alert-danger">{err}</div>}
      {me && (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5 mb-1">{me.name}</h2>
            <p className="text-muted mb-0">{me.email}</p>
          </div>
        </div>
      )}
      <h2 className="h6 text-muted">Your posts</h2>
      {posts.length === 0 && !loading && <p className="text-muted">You have not posted yet.</p>}
      {posts.map((p) => (
        <PostCard key={p._id} post={p} onUpdate={load} />
      ))}
    </div>
  );
}
