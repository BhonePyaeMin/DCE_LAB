import { AnimatePresence, motion } from 'framer-motion';
import { titleCase } from '../utils/format.js';

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  red: 'bg-brand-50 text-brand-800 ring-brand-200',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200',
};

const STATUS_TONE = {
  // reservations / borrowings
  pending: 'amber',
  approved: 'blue',
  rejected: 'red',
  cancelled: 'slate',
  completed: 'green',
  borrowed: 'violet',
  returned: 'green',
  overdue: 'red',
  damaged: 'red',
  // maintenance
  reported: 'amber',
  under_review: 'blue',
  in_progress: 'violet',
  resolved: 'green',
  unrepairable: 'red',
  // equipment condition and laboratory status
  good: 'green',
  fair: 'amber',
  poor: 'amber',
  maintenance: 'violet',
  active: 'green',
  closed: 'slate',
  // severity
  low: 'slate',
  medium: 'amber',
  high: 'red',
  // roles
  admin: 'red',
  lecturer: 'blue',
  student: 'slate',
};

/** Text status badge. The label changes with a short cross-fade so status updates feel smooth. */
export function StatusBadge({ status, label, tone }) {
  const text = label || titleCase(status);
  const classes = TONES[tone || STATUS_TONE[status] || 'slate'];
  return (
    <span className={`inline-flex items-center overflow-hidden rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
