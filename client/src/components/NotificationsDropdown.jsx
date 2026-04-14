import { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import api from '../api';

function getMessage(item) {
  if (item.type === 'like') return `${item.actor?.name || 'Someone'} liked your post`;
  if (item.type === 'comment') return `${item.actor?.name || 'Someone'} commented on your post`;
  if (item.type === 'follow') return `${item.actor?.name || 'Someone'} followed you`;
  return 'New activity';
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function load() {
    const { data } = await api.get('/notifications');
    setItems(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function markAllRead() {
    await api.put('/notifications/read', {});
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button type="button" className="icon-btn relative" onClick={() => setOpen((v) => !v)} title="Notifications">
        <FiBell />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />}
      </button>

      {open && (
        <div className="glass-card absolute right-0 z-50 mt-2 w-80 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" className="text-xs text-blue-600 dark:text-blue-400" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {items.length === 0 && (
              <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                No notifications yet
              </p>
            )}
            {items.map((item) => (
              <div
                key={item._id}
                className={`rounded-xl px-3 py-2 text-sm ${item.isRead ? 'bg-white/70 dark:bg-slate-800/70' : 'bg-blue-50 dark:bg-blue-900/20'}`}
              >
                {getMessage(item)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
