import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, FlaskConical, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import api, { assetUrl, errorMessage, toFormData } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Button, EmptyState, ErrorNotice, Field, PageHeader, SearchInput, Skeleton } from '../components/ui.jsx';
import { ConfirmDialog, Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { fadeUp, staggerContainer } from '../animations/variants.js';

const EMPTY = { name: '', code: '', location: '', capacity: 20, description: '', facilities: '', status: 'active', openTime: '08:00', closeTime: '20:00' };

function LabForm({ lab, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(lab ? { ...lab, facilities: (lab.facilities || []).join(', ') } : EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { name, code, location, capacity, description, facilities, status, openTime, closeTime } = form;
      const body = toFormData({ name, code, location, capacity, description, facilities, status, openTime, closeTime }, { image: file });
      if (lab) await api.patch(`/laboratories/${lab._id}`, body);
      else await api.post('/laboratories', body);
      toast.success(lab ? 'Laboratory updated' : 'Laboratory created');
      onSaved();
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
      title={lab ? 'Edit laboratory' : 'Add laboratory'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="lab-form" loading={saving}>
            {lab ? 'Save changes' : 'Create laboratory'}
          </Button>
        </>
      }
    >
      <form id="lab-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <input className="input" required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Room code">
          <input className="input" required value={form.code} onChange={set('code')} />
        </Field>
        <Field label="Capacity">
          <input className="input" type="number" min="1" required value={form.capacity} onChange={set('capacity')} />
        </Field>
        <Field label="Location" className="sm:col-span-2">
          <input className="input" value={form.location || ''} onChange={set('location')} />
        </Field>
        <Field label="Opens">
          <input className="input" type="time" required value={form.openTime} onChange={set('openTime')} />
        </Field>
        <Field label="Closes">
          <input className="input" type="time" required value={form.closeTime} onChange={set('closeTime')} />
        </Field>
        <Field label="Facilities" hint="Separate with commas." className="sm:col-span-2">
          <input className="input" value={form.facilities} onChange={set('facilities')} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className="input" rows={3} value={form.description || ''} onChange={set('description')} />
        </Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="maintenance">Under maintenance</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Photo" hint="JPEG, PNG or WebP, up to 5 MB.">
          <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </Field>
      </form>
    </Modal>
  );
}

export default function Laboratories() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const query = useDebounce(q);
  const { data, loading, error, reload } = useFetch('/laboratories', { params: { q: query || undefined }, watch: ['laboratories'] });
  const [editing, setEditing] = useState(null); // lab object, or {} for a new one
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/laboratories/${deleting._id}`);
      toast.success('Laboratory deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Laboratories"
        description="Browse the department laboratories, their facilities and opening hours."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search laboratories" className="w-56" />
            {isAdmin && (
              <Button icon={Plus} onClick={() => setEditing({})}>
                Add laboratory
              </Button>
            )}
          </>
        }
      />
      <ErrorNotice message={error} onRetry={reload} />

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={FlaskConical} title="No laboratories found" description={isAdmin ? 'Add the first laboratory to get started.' : 'Try a different search.'} />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {data?.items.map((lab) => (
              <motion.article key={lab._id} layout variants={fadeUp} exit={{ opacity: 0, scale: 0.97 }} className="card flex flex-col overflow-hidden">
                {lab.image ? (
                  <img src={assetUrl(lab.image)} alt={lab.name} className="h-36 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-slate-100 text-slate-300">
                    <FlaskConical size={40} />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{lab.name}</h2>
                      <p className="text-xs text-slate-500">{lab.code}</p>
                    </div>
                    <StatusBadge status={lab.status} label={lab.status === 'maintenance' ? 'Maintenance' : undefined} />
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                    {lab.location && (
                      <li className="flex items-center gap-2">
                        <MapPin size={15} className="text-slate-400" /> {lab.location}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Users size={15} className="text-slate-400" /> Capacity {lab.capacity}
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock size={15} className="text-slate-400" /> {lab.openTime} - {lab.closeTime}
                    </li>
                  </ul>
                  {lab.facilities?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {lab.facilities.map((f) => (
                        <span key={f} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {lab.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{lab.description}</p>}
                  <div className="mt-auto flex items-center gap-2 pt-4">
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(lab)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleting(lab)} aria-label={`Delete ${lab.name}`} />
                      </>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {editing && (
        <LabForm
          lab={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} danger title="Delete laboratory" message={`Delete ${deleting?.name}? This cannot be undone.`} confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDeleting(null)} />
    </>
  );
}
