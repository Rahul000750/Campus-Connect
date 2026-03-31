import { useState } from 'react';
import api from '../api';

export default function CommentBox({ postId, onCommentAdded }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/comment', { postId, text: text.trim() });
      setText('');
      if (onCommentAdded) onCommentAdded(data);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not add comment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2">
      {err && <div className="alert alert-danger py-1 small">{err}</div>}
      <div className="input-group input-group-sm">
        <input
          className="form-control"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-outline-primary" type="submit" disabled={loading}>
          {loading ? '...' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
