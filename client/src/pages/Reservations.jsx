import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, endOfMonth, format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Ban, CalendarDays, Check, Plus, TriangleAlert, X } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Card, EmptyState, ErrorNotice, Field, PageHeader, Pagination, Segmented, TableSkeleton } from '../components/ui.jsx';
import { ConfirmDialog, Modal } from '../components/Modal.jsx';
import { MonthCalendar } from '../components/MonthCalendar.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { listItem } from '../animations/variants.js';
import { fmtDateTime, fmtRange, fmtTime, toDateInput } from '../utils/format.js';

function BookingModal({ initialDate, initialLab, labs, onClose, onCreated }) {
  const toast = useToast();
  const activeLabs = labs.filter((l) => l.status === 'active');
  const [form, setForm] = useState({
    laboratory: initialLab && activeLabs.some((l) => l._id === initialLab) ? initialLab : activeLabs[0]?._id || '',
    date: toDateInput(initialDate || addDays(new Date(), 1)),
    start: '10:00',
    end: '12:00',
    attendees: 1,
    purpose: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const lab = activeLabs.find((l) => l._id === form.laboratory);

  const startTime = new Date(`${form.date}T${form.start}`);
  const endTime = new Date(`${form.date}T${form.end}`);
  const validRange = !Number.isNaN(startTime.getTime()) && !Number.isNaN(endTime.getTime()) && endTime > startTime;

  // Live availability check against approved bookings for the chosen day.
  const dayParams = useMemo(() => ({ from: new Date(`${form.date}T00:00`).toISOString(), to: new Date(`${form.date}T23:59:59`).toISOString(), laboratory: form.laboratory }), [form.date, form.laboratory]);
  const { data: day } = useFetch('/reservations/schedule', { params: dayParams, enabled: Boolean(form.laboratory && form.date) });
  const slots = day?.items || [];
  const conflict = validRange && slots.find((s) => s.status === 'approved' && new Date(s.startTime) < endTime && new Date(s.endTime) > startTime);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/reservations', { laboratory: form.laboratory, startTime: startTime.toISOString(), endTime: endTime.toISOString(), attendees: Number(form.attendees), purpose: form.purpose });
      toast.success('Reservation request submitted for approval');
      onCreated();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Reserve a laboratory"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="booking-form" loading={saving} disabled={!validRange || Boolean(conflict) || !form.laboratory}>
            Submit request
          </Button>
        </>
      }
    >
      <form id="booking-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Laboratory" className="sm:col-span-2">
          <select className="input" required value={form.laboratory} onChange={set('laboratory')}>
            {activeLabs.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name} ({l.code}) - capacity {l.capacity}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" className="sm:col-span-2">
          <input className="input" type="date" required min={toDateInput(new Date())} value={form.date} onChange={set('date')} />
        </Field>
        <Field label="Start time" hint={lab ? `Open ${lab.openTime} - ${lab.closeTime}` : undefined}>
          <input className="input" type="time" required value={form.start} onChange={set('start')} />
        </Field>
        <Field label="End time">
          <input className="input" type="time" required value={form.end} onChange={set('end')} />
        </Field>
        <Field label="Number of attendees" hint={lab ? `Up to ${lab.capacity} people` : undefined}>
          <input className="input" type="number" min="1" max={lab?.capacity || 1000} required value={form.attendees} onChange={set('attendees')} />
        </Field>
        <Field label="Purpose" className="sm:col-span-2">
          <textarea className="input" rows={3} required minLength={3} maxLength={500} value={form.purpose} onChange={set('purpose')} placeholder="e.g. Embedded systems practical, week 8" />
        </Field>

        <div className="sm:col-span-2">
          {!validRange && form.start && form.end && <p className="flex items-center gap-2 text-sm text-brand-700"><TriangleAlert size={16} /> End time must be after the start time.</p>}
          {conflict && (
            <p className="flex items-center gap-2 rounded border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800" role="alert">
              <TriangleAlert size={16} className="shrink-0" /> This overlaps an approved booking ({fmtTime(conflict.startTime)} - {fmtTime(conflict.endTime)}). Choose another time.
            </p>
          )}
          {slots.length > 0 && (
            <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Already booked on this day</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {slots.map((s) => (
                  <li key={s._id} className="flex items-center justify-between">
                    <span>
                      {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
                    </span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

function ReviewModal({ reservation, action, onClose, onDone }) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const approve = action === 'approved';

  const submit = async () => {
    setSaving(true);
    try {
      await api.patch(`/reservations/${reservation._id}/review`, { status: action, note: note || undefined });
      toast.success(`Reservation ${action}`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={approve ? 'Approve reservation' : 'Reject reservation'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={approve ? 'primary' : 'danger'} loading={saving} onClick={submit}>
            {approve ? 'Approve' : 'Reject'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {reservation.user?.name} - {reservation.laboratory?.name}
        <br />
        {fmtRange(reservation.startTime, reservation.endTime)}
      </p>
      <Field label={approve ? 'Note (optional)' : 'Reason (optional)'} className="mt-4">
        <textarea className="input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  );
}

export default function Reservations() {
  const { user, isAdmin, isLecturer } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('calendar');
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [labFilter, setLabFilter] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [booking, setBooking] = useState(null); // { date, lab }
  const [review, setReview] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const labs = useFetch('/laboratories').data?.items || [];

  // Arriving from the Laboratories page with ?lab=<id> opens the booking dialog directly.
  const requestedLab = params.get('lab');
  useEffect(() => {
    if (requestedLab && labs.length) {
      setBooking({ date: addDays(new Date(), 1), lab: requestedLab });
      setParams({}, { replace: true });
    }
  }, [requestedLab, labs.length, setParams]);

  const scheduleParams = useMemo(
    () => ({
      from: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }).toISOString(),
      laboratory: labFilter || undefined,
    }),
    [month, labFilter]
  );
  const schedule = useFetch('/reservations/schedule', { params: scheduleParams, watch: ['reservations'], enabled: tab === 'calendar' });

  const markers = useMemo(() => {
    const map = {};
    (schedule.data?.items || []).forEach((s) => {
      const key = format(new Date(s.startTime), 'yyyy-MM-dd');
      map[key] ||= { approved: 0, pending: 0 };
      map[key][s.status === 'approved' ? 'approved' : 'pending'] += 1;
    });
    return map;
  }, [schedule.data]);

  const daySlots = (schedule.data?.items || []).filter((s) => format(new Date(s.startTime), 'yyyy-MM-dd') === format(selected, 'yyyy-MM-dd'));

  const listScope = tab === 'review' ? 'review' : undefined;
  const list = useFetch('/reservations', {
    params: { page, limit: 10, status: status || undefined, scope: listScope, mine: tab === 'mine' && isAdmin ? 'true' : undefined },
    watch: ['reservations'],
    enabled: tab !== 'calendar',
  });

  const tabs = [
    { value: 'calendar', label: 'Calendar' },
    { value: 'mine', label: isAdmin ? 'My requests' : 'My reservations' },
    ...(isAdmin ? [{ value: 'all', label: 'All requests' }] : []),
    ...(isLecturer ? [{ value: 'review', label: 'Student requests' }] : []),
  ];
  const changeTab = (t) => {
    setTab(t);
    setPage(1);
    setStatus('');
  };
  // Admins see everything on "All requests"; "My requests" narrows to their own.
  const effectiveItems = list.data?.items || [];

  const canReview = (r) => r.status === 'pending' && (isAdmin || (isLecturer && r.user?.role === 'student')) && r.user?._id !== user._id;
  const canCancel = (r) => ['pending', 'approved'].includes(r.status) && new Date(r.endTime) > new Date() && (r.user?._id === user._id || isAdmin);

  const doCancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/reservations/${cancelling._id}/cancel`);
      toast.success('Reservation cancelled');
      setCancelling(null);
      list.reload();
      schedule.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const refreshAll = () => {
    list.reload();
    schedule.reload();
  };

  return (
    <>
      <PageHeader
        title="Reservations"
        description="Check availability and book laboratory sessions."
        actions={
          <Button icon={Plus} onClick={() => setBooking({ date: selected > new Date() ? selected : addDays(new Date(), 1) })} disabled={!labs.some((l) => l.status === 'active')}>
            New reservation
          </Button>
        }
      />

      <div className="mb-4">
        <Segmented label="reservation-view" options={tabs} value={tab} onChange={changeTab} />
      </div>

      {tab === 'calendar' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card
            title="Availability calendar"
            actions={
              <select className="input w-auto py-1 text-xs" value={labFilter} onChange={(e) => setLabFilter(e.target.value)} aria-label="Filter by laboratory">
                <option value="">All laboratories</option>
                {labs.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            }
          >
            <ErrorNotice message={schedule.error} onRetry={schedule.reload} />
            <MonthCalendar month={month} onMonthChange={setMonth} selected={selected} onSelect={setSelected} markers={markers} />
          </Card>

          <Card title={format(selected, 'EEEE, d MMMM')} padded={false}>
            {daySlots.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nothing booked" description="This day is fully available." />
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {daySlots.map((s) => (
                    <motion.li key={s._id} layout variants={listItem} initial="initial" animate="animate" exit="exit" className="border-b border-slate-100 px-4 py-3 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
                        </span>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{s.laboratory?.name}</p>
                      {(s.user || s.purpose) && (
                        <p className="truncate text-xs text-slate-400">
                          {s.user?.name} {s.purpose ? `- ${s.purpose}` : ''}
                        </p>
                      )}
                      {s.mine && <p className="mt-1 text-xs font-medium text-brand-700">Your booking</p>}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            <div className="border-t border-slate-100 p-3">
              <Button size="sm" variant="secondary" icon={Plus} className="w-full" onClick={() => setBooking({ date: selected > new Date() ? selected : addDays(new Date(), 1), lab: labFilter })}>
                Reserve on this day
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card padded={false}>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
            <select className="input w-auto py-1.5" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
              <option value="">All statuses</option>
              {['pending', 'approved', 'rejected', 'cancelled', 'completed'].map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <ErrorNotice message={list.error} onRetry={list.reload} />
          {list.loading && !list.data ? (
            <TableSkeleton cols={6} />
          ) : effectiveItems.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No reservations" description="Requests you create or need to review will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <th className="th">Laboratory</th>
                    {(isAdmin || isLecturer) && <th className="th">Requested by</th>}
                    <th className="th">When</th>
                    <th className="th">Purpose</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {effectiveItems.map((r) => (
                      <motion.tr key={r._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td className="td font-medium text-slate-900">{r.laboratory?.name}</td>
                        {(isAdmin || isLecturer) && (
                          <td className="td">
                            {r.user?.name}
                            <span className="block text-xs text-slate-400">{r.user?.role}</span>
                          </td>
                        )}
                        <td className="td whitespace-nowrap">{fmtRange(r.startTime, r.endTime)}</td>
                        <td className="td max-w-[16rem]">
                          <span className="line-clamp-2">{r.purpose}</span>
                          {r.reviewNote && <span className="block text-xs text-slate-400">Note: {r.reviewNote}</span>}
                        </td>
                        <td className="td">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-1.5">
                            {canReview(r) && (
                              <>
                                <Button size="sm" icon={Check} onClick={() => setReview({ reservation: r, action: 'approved' })}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="danger" icon={X} onClick={() => setReview({ reservation: r, action: 'rejected' })}>
                                  Reject
                                </Button>
                              </>
                            )}
                            {canCancel(r) && (
                              <Button size="sm" variant="secondary" icon={Ban} onClick={() => setCancelling(r)}>
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={list.data?.page} pages={list.data?.pages} total={list.data?.total} onChange={setPage} />
        </Card>
      )}

      {booking && (
        <BookingModal
          initialDate={booking.date}
          initialLab={booking.lab}
          labs={labs}
          onClose={() => setBooking(null)}
          onCreated={() => {
            setBooking(null);
            refreshAll();
          }}
        />
      )}
      {review && (
        <ReviewModal
          {...review}
          onClose={() => setReview(null)}
          onDone={() => {
            setReview(null);
            refreshAll();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(cancelling)}
        danger
        title="Cancel reservation"
        message={cancelling ? `Cancel the booking for ${cancelling.laboratory?.name} on ${fmtDateTime(cancelling.startTime)}?` : ''}
        confirmLabel="Cancel reservation"
        loading={busy}
        onConfirm={doCancel}
        onClose={() => setCancelling(null)}
      />
    </>
  );
}
