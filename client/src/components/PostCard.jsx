import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookmark, FiEdit2, FiHeart, FiMessageCircle, FiSend, FiTrash2 } from 'react-icons/fi';
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
  const [saved, setSaved] = useState(Boolean(post.isSaved));
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const user = getStoredUser();
  const { addToast } = useToast();

  useEffect(() => {
    setLikes(post.likes || []);
    setComments(post.comments || []);
    setSaved(Boolean(post.isSaved));
    setEditText(post.text || '');
  }, [post._id, post.likes, post.comments]);

  const liked =
    user &&
    likes.some(
      (id) => id === (user.id || user._id) || id?._id === (user.id || user._id) || String(id) === String(user.id || user._id)
    );

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

  async function toggleSave() {
    try {
      const { data } = await api.post(`/posts/${post._id}/save`);
      setSaved(Boolean(data.saved));
      addToast(data.saved ? 'Post saved' : 'Post removed from saved', 'success');
      if (onUpdate) onUpdate();
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not save post', 'error');
    }
  }

  async function deletePost() {
    try {
      await api.delete(`/posts/${post._id}`);
      addToast('Post deleted', 'success');
      if (onUpdate) onUpdate();
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not delete post', 'error');
    }
  }

  async function updatePost() {
    if (!editText.trim()) return;
    try {
      await api.put(`/posts/${post._id}`, { text: editText.trim() });
      setEditing(false);
      addToast('Post updated', 'success');
      if (onUpdate) onUpdate();
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not update post', 'error');
    }
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast('Post link copied', 'success');
    } catch {
      addToast('Could not copy link', 'error');
    }
  }

  const isOwner = String(post.author?._id || post.author) === String(user?.id || user?._id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 p-[2px]">
            {post.author?.avatarUrl || post.author?.profilePic ? (
              <img
                src={post.author?.profilePic || post.author?.avatarUrl}
                alt="author"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-semibold dark:bg-slate-900">
                {(post.author?.name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <Link className="text-sm font-semibold hover:underline sm:text-base" to={`/profile/${post.author?._id || post.author}`}>
              {post.author?.name || 'Student'}
            </Link>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {post.createdAt && new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-2">
          <textarea className="input-modern min-h-24 resize-none" value={editText} onChange={(e) => setEditText(e.target.value)} />
          <div className="flex gap-2">
            <button type="button" className="primary-btn px-4 py-2 text-sm" onClick={updatePost}>
              Save
            </button>
            <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">{post.text}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post visual"
              className="mt-3 max-h-96 w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
            />
          )}
        </>
      )}

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
        <button type="button" onClick={sharePost} className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <FiSend />
        </button>
        <button
          type="button"
          onClick={toggleSave}
          className={`rounded-xl px-3 py-2 text-sm ${saved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
          <FiBookmark />
        </button>
        {isOwner && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <FiEdit2 />
            </button>
            <button type="button" onClick={deletePost} className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300">
              <FiTrash2 />
            </button>
          </>
        )}
      </div>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
          {comments.map((c) => (
            <li key={c._id} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">
              <span className="inline-flex items-center gap-2">
                {(c.author?.avatarUrl || c.author?.profilePic) && (
                  <img
                    src={c.author?.profilePic || c.author?.avatarUrl}
                    alt="comment author"
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <strong>{c.author?.name || 'User'}:</strong> {c.text}
              </span>
            </li>
          ))}
        </ul>
      )}
      <CommentBox postId={post._id} onCommentAdded={onCommentAdded} />
    </motion.article>
  );
}
