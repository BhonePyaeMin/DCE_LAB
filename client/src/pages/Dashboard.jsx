import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, ClipboardList, FlaskConical, Package, PackageCheck, PackageOpen, Truck, TriangleAlert, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Card, EmptyState, ErrorNotice, PageHeader, Skeleton } from '../components/ui.jsx';
import { EquipmentImage } from '../components/EquipmentImage.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { AnimatedNumber } from '../components/AnimatedNumber.jsx';
import { fadeUp, staggerContainer } from '../animations/variants.js';
import { fmtDate, timeAgo, titleCase } from '../utils/format.js';

const CONDITION_COLORS = { good: '#059669', fair: '#d97706', poor: '#ea580c', damaged: '#c8102e', maintenance: '#7c3aed' };

function StatCard({ icon: Icon, label, value, to, tone = 'slate', hint }) {
  const tones = { slate: 'bg-slate-100 text-slate-600', brand: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' };
  const body = (
    <motion.div variants={fadeUp} whileHover={{ y: -2 }} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-pop">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded ${tones[tone]}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900">
          <AnimatedNumber value={value} />
        </p>
        <p className="truncate text-sm text-slate-500">{label}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </motion.div>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function Dashboard() {
  const { user, isStaff } = useAuth();
  const reduce = useReducedMotion();
  const { data, loading, error, reload } = useFetch('/analytics/dashboard', { watch: ['borrowings', 'equipment', 'maintenance'] });

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </>
    );
  }
  if (error && !data) return <ErrorNotice message={error} onRetry={reload} />;

  const { stats, upcomingItems, recentActivity, conditionOverview } = data;
  const mine = !isStaff;
  const chart = conditionOverview.map((c) => ({ name: titleCase(c.condition), key: c.condition, units: c.units }));

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name.split(' ')[0]}`} description="Here is what is happening in the laboratories today." />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FlaskConical} label="Active laboratories" value={stats.laboratories} to="/laboratories" tone="brand" />
        <StatCard icon={Package} label="Equipment items" value={stats.equipmentItems} to="/equipment" hint={`${stats.totalUnits} units in total`} />
        <StatCard icon={PackageCheck} label="Available units" value={stats.availableUnits} to="/equipment" tone="green" />
        <StatCard icon={PackageOpen} label={mine ? 'Units I have borrowed' : 'Units currently borrowed'} value={stats.borrowedUnits} to="/borrowings" tone="violet" />
        <StatCard icon={ClipboardList} label={mine ? 'My pending borrow requests' : 'Pending borrow requests'} value={stats.pendingBorrowings} to="/borrowings" tone="amber" />
        <StatCard icon={Truck} label={mine ? 'Ready for me to collect' : 'Approved, awaiting pick-up'} value={stats.readyForPickup} to="/borrowings" tone="slate" />
        <StatCard icon={TriangleAlert} label={mine ? 'My overdue items' : 'Overdue equipment'} value={stats.overdue} to="/borrowings" tone={stats.overdue ? 'brand' : 'slate'} />
        <StatCard icon={Wrench} label="Open maintenance reports" value={stats.openMaintenance} to="/maintenance" hint={stats.damagedUnits ? `${stats.damagedUnits} damaged unit(s)` : undefined} />
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Equipment condition overview" className="lg:col-span-2">
          {chart.length === 0 ? (
            <EmptyState icon={Package} title="No equipment yet" description="Register equipment to see its condition here." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v) => [`${v} units`, 'Quantity']} />
                  <Bar dataKey="units" radius={[2, 2, 0, 0]} isAnimationActive={!reduce} animationDuration={700} maxBarSize={56}>
                    {chart.map((c) => (
                      <Cell key={c.key} fill={CONDITION_COLORS[c.key] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Next pick-ups and returns" actions={<Link to="/calendar" className="text-xs font-medium text-brand-700 hover:underline">Open calendar</Link>} padded={false}>
          {upcomingItems.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nothing coming up" description="Approved and borrowed equipment will appear here." />
          ) : (
            <ul>
              {upcomingItems.map((b, i) => (
                <motion.li key={b._id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                  <EquipmentImage item={b.equipment} className="h-11 w-14 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {b.quantity} x {b.equipment?.name}
                    </p>
                    <p className={`text-xs ${b.status === 'overdue' ? 'font-semibold text-brand-700' : 'text-slate-500'}`}>
                      {b.status === 'approved' ? `Pick-up ${fmtDate(b.borrowDate)}` : `Return by ${fmtDate(b.dueDate)}`}
                    </p>
                    {isStaff && <p className="truncate text-xs text-slate-400">{b.user?.name}</p>}
                  </div>
                  <StatusBadge status={b.status} />
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent activity" className="mt-6" padded={false}>
        {recentActivity.length === 0 ? (
          <EmptyState title="No activity yet" description="Actions in the system will be listed here." />
        ) : (
          <ul>
            {recentActivity.map((a, i) => (
              <motion.li key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }} className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{a.description || a.action}</p>
                  <p className="text-xs text-slate-400">{a.user?.name || 'System'}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
