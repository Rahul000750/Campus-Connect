import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBookmark, FiHeart, FiMessageCircle, FiSend } from 'react-icons/fi';
import api from '../api';
import CommentBox from './CommentBox';
import { useToast } from '../context/ToastContext';

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
  const { addToast } = useToast();

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
      addToast(liked ? 'Removed from likes' : 'Liked post', 'success');
      if (onUpdate) onUpdate();
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not update like', 'error');
    }
  }

  function onCommentAdded(comment) {
    setComments((c) => [...c, comment]);
    if (onUpdate) onUpdate();
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-semibold dark:bg-slate-900">
              {(post.author?.name || 'S').charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <strong className="text-sm sm:text-base">{post.author?.name || 'Student'}</strong>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {post.createdAt && new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">{post.text}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-xl px-3 py-2 text-sm transition ${
            liked
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          onClick={toggleLike}
        >
          <span className="inline-flex items-center gap-1.5">
            <FiHeart /> {likes.length}
          </span>
        </button>
        <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <FiMessageCircle /> {comments.length}
          </span>
        </button>
        <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <FiSend />
        </button>
        <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <FiBookmark />
        </button>
      </div>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
          {comments.map((c) => (
            <li key={c._id} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">
              <strong>{c.author?.name || 'User'}:</strong> {c.text}
            </li>
          ))}
        </ul>
      )}
      <CommentBox postId={post._id} onCommentAdded={onCommentAdded} />
    </motion.article>
  );
}
