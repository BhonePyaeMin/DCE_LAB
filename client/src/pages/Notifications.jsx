import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Button, Card, EmptyState, IconButton, PageHeader } from '../components/ui.jsx';
import { listItem } from '../animations/variants.js';
import { fmtDateTime, titleCase } from '../utils/format.js';

export default function Notifications() {
  const { items, unread, markRead, markAllRead, remove } = useNotifications();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You are all caught up.'}
        actions={
          unread > 0 && (
            <Button variant="secondary" icon={CheckCheck} onClick={markAllRead}>
              Mark all as read
            </Button>
          )
        }
      />
      <Card padded={false}>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="Approvals, reminders and status updates will show up here." />
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {items.map((n) => (
                <motion.li key={n._id} layout variants={listItem} initial="initial" animate="animate" exit="exit" className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 ${n.read ? '' : 'bg-brand-50/40'}`}>
                  <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-200' : 'bg-brand-600'}`} />
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      if (!n.read) markRead(n._id);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{titleCase(n.type)}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-600">{n.message}</span>
                    <span className="mt-1 block text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                  </button>
                  <IconButton icon={Trash2} label="Delete notification" onClick={() => remove(n._id)} className="hover:text-brand-700" />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </>
  );
}
