import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import api from '../api';
import { useToast } from '../context/ToastContext';

export default function CommentBox({ postId, onCommentAdded }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { addToast } = useToast();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/comment', { postId, text: text.trim() });
      setText('');
      if (onCommentAdded) onCommentAdded(data);
      addToast('Comment added', 'success');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not add comment';
      setErr(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      {err && (
        <div className="rounded-xl border border-rose-300/50 bg-rose-100/60 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="input-modern py-2"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="primary-btn px-4 py-2 text-sm" type="submit" disabled={loading}>
          {loading ? '...' : <FiSend />}
        </button>
      </div>
    </form>
  );
}
