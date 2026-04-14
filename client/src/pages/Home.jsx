import { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import PageTransition from '../components/ui/PageTransition';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { addToast } = useToast();

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
      await api.post('/post', { text: text.trim(), imageUrl: imageUrl.trim() });
      setText('');
      setImageUrl('');
      addToast('Post published successfully', 'success');
      await load();
    } catch (error) {
      const message = error.response?.data?.message || 'Could not create post';
      setErr(message);
      addToast(message, 'error');
    } finally {
      setPosting(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto grid w-full max-w-6xl gap-5 xl:grid-cols-[1fr_18rem]">
        <section className="space-y-4">
          <header className="glass-card p-5">
            <h1 className="text-xl font-semibold">Home Feed</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Share updates with your campus network.
            </p>
          </header>

          <section className="glass-card p-4 sm:p-5">
            <form onSubmit={createPost} className="space-y-3">
              {err && (
                <div className="rounded-2xl border border-rose-300/50 bg-rose-100/60 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                  {err}
                </div>
              )}
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Create a new post</label>
              <textarea
                className="input-modern min-h-24 resize-none"
                rows={3}
                placeholder="What is on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <input
                className="input-modern"
                placeholder="Optional image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button type="submit" className="primary-btn" disabled={posting}>
                {posting ? 'Posting...' : 'Publish'}
              </button>
            </form>
          </section>

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-52" />
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="glass-card p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No posts yet. Be the first one to post.
            </div>
          )}

          {posts.map((p) => (
            <PostCard key={p._id} post={p} onUpdate={load} />
          ))}
        </section>
        <Sidebar />
      </div>
    </PageTransition>
  );
}
