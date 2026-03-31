import { useState, useEffect } from 'react';
import api from '../api';
import CommentBox from './CommentBox';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function PostCard({ post, onUpdate }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const user = getStoredUser();

  useEffect(() => {
    setLikes(post.likes || []);
    setComments(post.comments || []);
  }, [post._id, post.likes, post.comments]);

  const liked =
    user && likes.some((id) => id === user.id || id?._id === user.id || String(id) === String(user.id));

  async function toggleLike() {
    try {
      const { data } = await api.post('/like', { postId: post._id });
      setLikes(data.likes || []);
      if (onUpdate) onUpdate();
    } catch {
      /* ignore */
    }
  }

  function onCommentAdded(comment) {
    setComments((c) => [...c, comment]);
    if (onUpdate) onUpdate();
  }

  return (
    <div className="post-card p-3 mb-3">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <strong>{post.author?.name || 'Student'}</strong>
          <div className="text-muted small">
            {post.createdAt && new Date(post.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      <p className="mb-2 mt-2">{post.text}</p>
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={toggleLike}
        >
          Like ({likes.length})
        </button>
      </div>
      {comments.length > 0 && (
        <ul className="list-unstyled small mt-2 mb-0 border-top pt-2">
          {comments.map((c) => (
            <li key={c._id} className="mb-1">
              <strong>{c.author?.name}:</strong> {c.text}
            </li>
          ))}
        </ul>
      )}
      <CommentBox postId={post._id} onCommentAdded={onCommentAdded} />
    </div>
  );
}
