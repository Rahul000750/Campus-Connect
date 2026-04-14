import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import PageTransition from '../components/ui/PageTransition';
import Skeleton from '../components/ui/Skeleton';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    setLoading(true);
    try {
      const { data } = await api.get(`/posts/${id}`);
      setPost(data);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not load post');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <button
          type="button"
          className="rounded-xl bg-white/70 px-3 py-2 text-sm dark:bg-slate-800/70"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        {loading && <Skeleton className="h-56" />}
        {err && (
          <div className="rounded-2xl border border-rose-300/50 bg-rose-100/60 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {err}
          </div>
        )}
        {post && <PostCard post={post} onUpdate={load} />}
      </div>
    </PageTransition>
  );
}
