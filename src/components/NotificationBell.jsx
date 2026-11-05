import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CloudRain, IndianRupee, Landmark, ListChecks } from 'lucide-react';
import { useApp } from '../context/AppContext';

const icons = { alert: CloudRain, market: IndianRupee, scheme: Landmark, task: ListChecks };

export default function NotificationBell({ dark = false }) {
  const { notifications, markAllRead, t, L } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notif.title')}
        aria-expanded={open}
        className={`relative h-11 w-11 sm:h-12 sm:w-12 grid place-items-center rounded-full transition ${
          dark ? 'bg-white/15 text-cream-50 hover:bg-white/25' : 'bg-white border border-cream-300 text-forest-700 hover:bg-forest-50'
        }`}
      >
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-clay-500 text-white text-[11px] font-extrabold grid place-items-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] card shadow-lift z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-300">
            <h3 className="font-extrabold text-forest-800">{t('notif.title')}</h3>
            <button onClick={markAllRead} className="text-sm font-bold text-forest-600 flex items-center gap-1 min-h-[40px]">
              <CheckCheck size={16} /> {t('notif.markRead')}
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto divide-y divide-cream-200">
            {notifications.length === 0 && <li className="p-6 text-center text-forest-600/70">{t('notif.empty')}</li>}
            {notifications.map((n) => {
              const Icon = icons[n.type] || Bell;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      n.to && nav(n.to);
                    }}
                    className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-forest-50 ${n.read ? '' : 'bg-earth-100/40'}`}
                  >
                    <span className="h-9 w-9 shrink-0 rounded-full bg-forest-50 text-forest-600 grid place-items-center">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-forest-800">{L(n.title)}</span>
                      <span className="block text-sm text-forest-600/80">{L(n.body)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
