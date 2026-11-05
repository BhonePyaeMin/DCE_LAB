import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './ui.jsx';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Month grid. `markers` maps 'yyyy-MM-dd' to { approved, pending } counts. */
export function MonthCalendar({ month, onMonthChange, selected, onSelect, markers = {} }) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const monthKey = format(month, 'yyyy-MM');

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{format(month, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))} />
          <button className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100" onClick={() => onMonthChange(new Date())}>
            Today
          </button>
          <IconButton icon={ChevronRight} label="Next month" onClick={() => onMonthChange(addMonths(month, 1))} />
        </div>
      </div>
      <div className="grid grid-cols-7 border-l border-t border-slate-200 text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-b border-r border-slate-200 bg-slate-50 py-1.5 text-center font-semibold text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={monthKey} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.14 }} className="grid grid-cols-7 border-l border-slate-200">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const mark = markers[key];
            const active = selected && isSameDay(day, selected);
            const outside = !isSameMonth(day, month);
            return (
              <button
                key={key}
                onClick={() => onSelect(day)}
                aria-label={`${format(day, 'EEEE d MMMM')}${mark ? `, ${mark.approved} approved, ${mark.pending} pending` : ''}`}
                aria-pressed={active}
                className={`relative flex h-16 flex-col items-start border-b border-r border-slate-200 p-1.5 text-left transition-colors sm:h-20 ${active ? 'bg-brand-50' : outside ? 'bg-slate-50/60 text-slate-400' : 'bg-white hover:bg-slate-50'}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${isToday(day) ? 'bg-brand-600 text-white' : active ? 'text-brand-700' : ''}`}>{format(day, 'd')}</span>
                {mark && (
                  <span className="mt-auto flex flex-wrap gap-1">
                    {mark.approved > 0 && <span className="rounded bg-sky-100 px-1 text-[10px] font-semibold text-sky-800">{mark.approved}</span>}
                    {mark.pending > 0 && <span className="rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-800">{mark.pending}</span>}
                  </span>
                )}
                {active && <motion.span layoutId="cal-active" className="pointer-events-none absolute inset-0 border-2 border-brand-600" transition={{ duration: 0.15 }} />}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-200" /> Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-200" /> Pending
        </span>
      </div>
    </div>
  );
}
