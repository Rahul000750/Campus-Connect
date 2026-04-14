import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';

export default function Sidebar() {
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [me, setMe] = useState(null);
  const { addToast } = useToast();

  async function load() {
    try {
      const [trendRes, sugRes, meRes] = await Promise.all([
        api.get('/trending'),
        api.get('/users/suggestions'),
        api.get('/users/me'),
      ]);
      setTrending(trendRes.data || []);
      setSuggestions(sugRes.data || []);
      setMe(meRes.data);
    } catch {
      // keep sidebar minimal on error
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleFollow(userId) {
    try {
      await api.post(`/users/follow/${userId}`);
      addToast('Connection updated', 'success');
      load();
    } catch (error) {
      addToast(error.response?.data?.message || 'Could not update connection', 'error');
    }
  }

  return (
    <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:gap-4">
      <section className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trending</h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          {trending.length === 0 && <li className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">No trends yet</li>}
          {trending.map((item) => (
            <li key={item.tag} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">
              {item.tag} <span className="text-xs text-slate-400">({item.count})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Suggestions</h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          {suggestions.length === 0 && <li className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">No suggestions</li>}
          {suggestions.map((user) => (
            <li key={user.id} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">
              <Link to={`/profile/${user.id}`} className="font-medium hover:underline">
                {user.name}
              </Link>
              <button type="button" className="ml-2 text-xs text-blue-600 dark:text-blue-400" onClick={() => toggleFollow(user.id)}>
                Follow
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Connections</h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <li className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">Followers: {me?.followersCount || 0}</li>
          <li className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-800/70">Following: {me?.followingCount || 0}</li>
        </ul>
      </section>
    </aside>
  );
}
