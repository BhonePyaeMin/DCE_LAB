import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Wrench } from 'lucide-react';
import api, { assetUrl, errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Card, EmptyState, ErrorNotice, Field, PageHeader, Pagination, Spinner, TableSkeleton } from '../components/ui.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ReportIssueModal } from '../components/ReportIssueModal.jsx';
import { fmtDate, fmtDateTime, titleCase } from '../utils/format.js';

const STATUSES = ['reported', 'under_review', 'in_progress', 'resolved', 'unrepairable'];
const OPEN = ['reported', 'under_review', 'in_progress'];

function DetailModal({ id, onClose, onChanged }) {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { data, loading, reload } = useFetch(`/maintenance/${id}`);
  const report = data?.report;
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const isOpen = report && OPEN.includes(report.status);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/maintenance/${id}`, { status, note: note || undefined });
      toast.success('Report updated');
      setStatus('');
      setNote('');
      reload();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Maintenance report" size="lg">
      {loading || !report ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold">{report.title}</h3>
              <p className="text-sm text-slate-500">
                {report.equipment?.name} ({report.equipment?.equipmentId})
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={report.severity} label={`${titleCase(report.severity)} severity`} />
              <StatusBadge status={report.status} />
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{report.description}</p>
          {report.stockQuantity > 0 && <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{report.stockQuantity} unit(s) are held out of stock until this report is closed.</p>}
          {report.images?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {report.images.map((src) => (
                <a key={src} href={assetUrl(src)} target="_blank" rel="noreferrer">
                  <img src={assetUrl(src)} alt="Attached evidence" className="h-24 w-24 rounded border border-slate-200 object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            Reported by {report.reportedBy?.name} on {fmtDateTime(report.createdAt)}
          </p>

          <div>
            <h4 className="mb-2 text-sm font-semibold">History</h4>
            <ol className="space-y-3 border-l border-slate-200 pl-4">
              {report.history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-brand-600" />
                  <p className="text-sm">
                    <span className="font-medium">{titleCase(h.status)}</span> <span className="text-slate-400">- {fmtDateTime(h.at)}</span>
                  </p>
                  {(h.note || h.by) && (
                    <p className="text-xs text-slate-500">
                      {h.by?.name}
                      {h.note ? `: ${h.note}` : ''}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {isAdmin && isOpen && (
            <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold">Update status</h4>
              <Field label="New status">
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Select status</option>
                  {STATUSES.filter((s) => s !== report.status).map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Note" hint={['resolved', 'unrepairable'].includes(status) ? 'Closing a report is final.' : undefined}>
                <textarea className="input" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button loading={saving} disabled={!status} onClick={save}>
                Save update
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Maintenance() {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reporting, setReporting] = useState(false);
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useFetch('/maintenance', { params: { status: status || undefined, page, limit: 10 }, watch: ['maintenance'] });

  return (
    <>
      <PageHeader
        title="Maintenance and damage reports"
        description={isAdmin ? 'Triage reports and track repairs.' : 'Report faulty equipment and follow the repair progress.'}
        actions={
          <Button icon={Plus} onClick={() => setReporting(true)}>
            Report an issue
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <select
            className="input w-auto py-1.5"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
        </div>
        <ErrorNotice message={error} onRetry={reload} />

        {loading && !data ? (
          <TableSkeleton cols={5} />
        ) : data?.items.length === 0 ? (
          <EmptyState icon={Wrench} title="No reports" description="Reported problems and repairs will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <th className="th">Issue</th>
                  <th className="th">Equipment</th>
                  <th className="th">Reported</th>
                  <th className="th">Severity</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {data?.items.map((m) => (
                    <motion.tr key={m._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpenId(m._id)}>
                      <td className="td">
                        <button className="text-left font-medium text-slate-900 hover:underline" onClick={() => setOpenId(m._id)}>
                          {m.title}
                        </button>
                        <p className="text-xs text-slate-400">by {m.reportedBy?.name}</p>
                      </td>
                      <td className="td">
                        {m.equipment?.name}
                        <span className="block text-xs text-slate-400">{m.equipment?.equipmentId}</span>
                      </td>
                      <td className="td whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                      <td className="td">
                        <StatusBadge status={m.severity} />
                      </td>
                      <td className="td">
                        <StatusBadge status={m.status} />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />
      </Card>

      {reporting && (
        <ReportIssueModal
          onClose={() => setReporting(false)}
          onCreated={() => {
            setReporting(false);
            reload();
          }}
        />
      )}
      {openId && <DetailModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
