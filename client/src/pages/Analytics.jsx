import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { startOfMonth, subMonths } from 'date-fns';
import { ChartNoAxesCombined, Download } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Card, EmptyState, ErrorNotice, PageHeader, Segmented, Skeleton } from '../components/ui.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { fadeUp, staggerContainer } from '../animations/variants.js';
import { fmtDate, titleCase } from '../utils/format.js';

const EXPORTS = [
  { type: 'borrowings', label: 'Borrowing history' },
  { type: 'reservations', label: 'Reservations' },
  { type: 'overdue', label: 'Overdue equipment' },
  { type: 'maintenance', label: 'Maintenance' },
  { type: 'equipment', label: 'Inventory' },
];

export default function Analytics() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [months, setMonths] = useState('6');
  const [downloading, setDownloading] = useState('');

  const range = useMemo(() => ({ from: startOfMonth(subMonths(new Date(), Number(months) - 1)).toISOString(), to: new Date().toISOString() }), [months]);
  const { data, loading, error, reload } = useFetch('/analytics/reports', { params: range, watch: ['borrowings', 'reservations', 'maintenance'] });

  const download = async (type) => {
    setDownloading(type);
    try {
      const res = await api.get(`/analytics/reports/export/${type}`, { params: range, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dce-lab-${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading('');
    }
  };

  const chartProps = { isAnimationActive: !reduce, animationDuration: 700 };

  return (
    <>
      <PageHeader
        title="Analytics and reports"
        description="Utilisation, bookings, borrowing and maintenance insights."
        actions={
          <Segmented
            label="analytics-range"
            value={months}
            onChange={setMonths}
            options={[
              { value: '3', label: '3 months' },
              { value: '6', label: '6 months' },
              { value: '12', label: '12 months' },
            ]}
          />
        }
      />
      <ErrorNotice message={error} onRetry={reload} />

      {loading && !data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        data && (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <Card title="Monthly activity">
                  {data.monthly.length === 0 ? (
                    <EmptyState icon={ChartNoAxesCombined} title="No data in this period" />
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} />
                          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="reservations" name="Reservations" fill="#c8102e" radius={[2, 2, 0, 0]} {...chartProps} />
                          <Bar dataKey="borrowings" name="Borrowing requests" fill="#475569" radius={[2, 2, 0, 0]} {...chartProps} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card title="Most borrowed equipment">
                  {data.equipmentUtilization.length === 0 ? (
                    <EmptyState icon={ChartNoAxesCombined} title="No borrowing in this period" />
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.equipmentUtilization} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} fontSize={11} />
                          <Tooltip cursor={{ fill: '#f1f5f9' }} />
                          <Bar dataKey="borrowings" name="Times borrowed" fill="#c8102e" radius={[0, 2, 2, 0]} maxBarSize={22} {...chartProps} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            <motion.div variants={fadeUp}>
              <Card title="Laboratory bookings" padded={false}>
                {data.laboratoryBookings.length === 0 ? (
                  <EmptyState title="No bookings in this period" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr>
                          <th className="th">Laboratory</th>
                          <th className="th">Requests</th>
                          <th className="th">Approved</th>
                          <th className="th">Rejected</th>
                          <th className="th">Pending</th>
                          <th className="th">Hours used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.laboratoryBookings.map((l) => (
                          <tr key={l.code}>
                            <td className="td font-medium text-slate-900">
                              {l.name} <span className="text-slate-400">({l.code})</span>
                            </td>
                            <td className="td">{l.total}</td>
                            <td className="td">{l.approved}</td>
                            <td className="td">{l.rejected}</td>
                            <td className="td">{l.pending}</td>
                            <td className="td">{l.hours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <Card title="Overdue equipment" padded={false}>
                  {data.overdue.length === 0 ? (
                    <EmptyState title="Nothing is overdue" description="All borrowed equipment is within its return date." />
                  ) : (
                    <ul>
                      {data.overdue.map((b) => (
                        <li key={b._id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {b.quantity} x {b.equipment?.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">{b.user?.name}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-brand-700">Due {fmtDate(b.dueDate)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card title="Maintenance summary">
                  {data.maintenance.byStatus.length === 0 ? (
                    <EmptyState title="No maintenance reports" />
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-3">
                        {data.maintenance.byStatus.map((s) => (
                          <div key={s.status} className="min-w-[7rem] rounded border border-slate-200 px-3 py-2">
                            <p className="text-xl font-bold">{s.count}</p>
                            <StatusBadge status={s.status} />
                          </div>
                        ))}
                      </div>
                      {data.maintenance.topEquipment.length > 0 && (
                        <>
                          <h3 className="mb-2 mt-5 text-sm font-semibold">Most reported equipment</h3>
                          <ul className="space-y-1.5 text-sm">
                            {data.maintenance.topEquipment.map((e) => (
                              <li key={e.equipmentId} className="flex justify-between gap-3">
                                <span className="truncate text-slate-700">{e.name}</span>
                                <span className="text-slate-500">
                                  {e.reports} report{e.reports === 1 ? '' : 's'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}
                </Card>
              </motion.div>
            </div>

            {isAdmin && (
              <motion.div variants={fadeUp}>
                <Card title="Export reports (CSV)">
                  <div className="flex flex-wrap gap-2">
                    {EXPORTS.map((e) => (
                      <Button key={e.type} variant="secondary" size="sm" icon={Download} loading={downloading === e.type} onClick={() => download(e.type)}>
                        {e.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Exports cover the selected period (inventory is always the current state).</p>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )
      )}
    </>
  );
}
