import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { dropdown, listItem } from '../animations/variants.js';
import { ROLE_LABEL, timeAgo } from '../utils/format.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

function useClickAway(ref, handler) {
  useEffect(() => {
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && handler();
    const onKey = (e) => e.key === 'Escape' && handler();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, handler]);
}

function NotificationMenu() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useClickAway(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded p-2 text-slate-600 hover:bg-slate-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Bell size={20} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div variants={dropdown} initial="hidden" animate="show" exit="exit" className="absolute right-0 z-30 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right rounded-md border border-slate-200 bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold">Notifications</h2>
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              <AnimatePresence initial={false}>
                {items.slice(0, 8).map((n) => (
                  <motion.li key={n._id} layout variants={listItem} initial="initial" animate="animate" exit="exit">
                    <button
                      onClick={() => {
                        if (!n.read) markRead(n._id);
                        setOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                      className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/40'}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-600'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">{n.title}</span>
                        <span className="block text-xs text-slate-600">{n.message}</span>
                        <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You are all caught up.</li>}
            </ul>
            <Link to="/notifications" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-center text-sm font-medium text-brand-700 hover:bg-slate-50">
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false));
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded p-1.5 hover:bg-slate-100" aria-expanded={open} aria-label="Account menu">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-slate-900">{user.name}</span>
          <span className="block text-xs leading-tight text-slate-500">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div variants={dropdown} initial="hidden" animate="show" exit="exit" className="absolute right-0 z-30 mt-2 w-60 origin-top-right rounded-md border border-slate-200 bg-white py-1 shadow-pop">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <div className="mt-2">
                <StatusBadge status={user.role} label={ROLE_LABEL[user.role]} />
              </div>
            </div>
            <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings size={16} /> Settings
            </Link>
            <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              <LogOut size={16} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Topbar({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button onClick={onMenu} className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-1">
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}
