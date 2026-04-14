import { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';
import PageTransition from '../components/ui/PageTransition';
import Skeleton from '../components/ui/Skeleton';

export default function Profile() {
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState('Posts');

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
    <PageTransition>
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {loading && (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-60" />
          </>
        )}

        {err && (
          <div className="rounded-2xl border border-rose-300/50 bg-rose-100/60 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {err}
          </div>
        )}

        {me && (
          <section className="glass-card p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 p-[3px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-2xl font-semibold dark:bg-slate-900">
                    {me.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{me.name}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{me.email}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Building my campus network and sharing meaningful updates.
                  </p>
                </div>
              </div>

              <button type="button" className="primary-btn">Edit Profile</button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-slate-800/70">
                <p className="text-xl font-semibold">{posts.length}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Posts</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-slate-800/70">
                <p className="text-xl font-semibold">248</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Followers</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-slate-800/70">
                <p className="text-xl font-semibold">182</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Following</p>
              </div>
            </div>
          </section>
        )}

        <section className="glass-card p-4">
          <div className="mb-4 flex gap-2">
            {['Posts', 'Media', 'Activity'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded-xl px-4 py-2 text-sm ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white/70 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Posts' && (
            <div className="space-y-3">
              {posts.length === 0 && !loading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">You have not posted yet.</p>
              ) : (
                posts.map((p) => <PostCard key={p._id} post={p} onUpdate={load} />)
              )}
            </div>
          )}

          {activeTab !== 'Posts' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700" />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
