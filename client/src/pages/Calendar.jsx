import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays, ClipboardList, PackageCheck, PackageOpen, Undo2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Card, EmptyState, ErrorNotice, PageHeader, Segmented } from '../components/ui.jsx';
import { MonthCalendar } from '../components/MonthCalendar.jsx';
import { EquipmentImage } from '../components/EquipmentImage.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { listItem } from '../animations/variants.js';
import { fmtTime } from '../utils/format.js';

// One entry per event kind so the grid chips, the legend and the day list always agree.
const EVENT_TYPES = {
  pickup: { label: 'Pick-up', chip: 'bg-sky-100 text-sky-800', swatch: 'bg-sky-200', icon: PackageOpen, tone: 'blue' },
  return: { label: 'Due for return', chip: 'bg-amber-100 text-amber-800', swatch: 'bg-amber-200', icon: Undo2, tone: 'amber' },
  returned: { label: 'Returned', chip: 'bg-emerald-100 text-emerald-800', swatch: 'bg-emerald-200', icon: PackageCheck, tone: 'green' },
};

export default function Calendar() {
  const { isStaff, isLecturer } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [type, setType] = useState('all');

  const range = useMemo(
    () => ({
      from: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }).toISOString(),
    }),
    [month]
  );
  const { data, loading, error, reload } = useFetch('/borrowings/calendar', { params: range, watch: ['borrowings'] });

  const events = useMemo(() => (data?.items || []).filter((e) => type === 'all' || e.type === type), [data, type]);

  const markers = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      const list = (map[key] ||= []);
      const existing = list.find((c) => c.label === e.type);
      if (existing) existing.count += 1;
      else list.push({ label: e.type, count: 1, className: EVENT_TYPES[e.type].chip });
    });
    return map;
  }, [events]);

  const selectedKey = format(selected, 'yyyy-MM-dd');
  const dayEvents = events.filter((e) => format(new Date(e.date), 'yyyy-MM-dd') === selectedKey);
  const showPeople = isStaff || isLecturer;

  return (
    <>
      <PageHeader
        title="Borrowing calendar"
        description={isStaff ? 'Equipment pick-ups and returns across the laboratory.' : 'Your equipment pick-up and return dates.'}
        actions={
          <Link to="/equipment">
            <Button icon={ClipboardList}>Borrow equipment</Button>
          </Link>
        }
      />

      <div className="mb-4">
        <Segmented
          label="calendar-filter"
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pickup', label: 'Pick-ups' },
            { value: 'return', label: 'Returns due' },
            { value: 'returned', label: 'Returned' },
          ]}
        />
      </div>
      <ErrorNotice message={error} onRetry={reload} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card title="Calendar">
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            markers={markers}
            legend={Object.values(EVENT_TYPES).map((t) => ({ label: t.label, className: t.swatch }))}
          />
          {loading && !data && <p className="mt-3 text-xs text-slate-400">Loading...</p>}
        </Card>

        <Card title={format(selected, 'EEEE, d MMMM')} padded={false}>
          {dayEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nothing scheduled" description="No pick-ups or returns on this day." />
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {dayEvents.map((e) => {
                  const meta = EVENT_TYPES[e.type];
                  const Icon = meta.icon;
                  return (
                    <motion.li key={`${e.borrowing}-${e.type}`} layout variants={listItem} initial="initial" animate="animate" exit="exit" className="flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                      <EquipmentImage item={e.equipment} className="h-12 w-16 shrink-0 rounded" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            <Icon size={15} className="text-slate-500" /> {meta.label}
                          </span>
                          <span className="text-xs text-slate-400">{e.type === 'returned' ? fmtTime(e.date) : ''}</span>
                        </div>
                        <p className="truncate text-sm text-slate-700">
                          {e.quantity} x {e.equipment?.name}
                        </p>
                        {showPeople && <p className="truncate text-xs text-slate-400">{e.mine ? 'You' : e.user?.name}</p>}
                        <div className="mt-1">
                          <StatusBadge status={e.status} />
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
          <div className="border-t border-slate-100 p-3">
            <Link to="/borrowings" className="text-sm font-medium text-brand-700 hover:underline">
              Open borrowing records
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
