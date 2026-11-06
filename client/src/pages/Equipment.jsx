import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays } from 'date-fns';
import { ClipboardList, ImagePlus, Package, Pencil, Plus, QrCode, Trash2, Wrench } from 'lucide-react';
import api, { errorMessage, toFormData } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Button, EmptyState, ErrorNotice, Field, IconButton, PageHeader, Pagination, SearchInput, Skeleton } from '../components/ui.jsx';
import { ConfirmDialog, Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EquipmentImage } from '../components/EquipmentImage.jsx';
import { QrModal } from '../components/QrModal.jsx';
import { ReportIssueModal } from '../components/ReportIssueModal.jsx';
import { toDateInput } from '../utils/format.js';

const CONDITIONS = ['good', 'fair', 'poor', 'damaged', 'maintenance'];

function EquipmentForm({ item, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    item
      ? { name: item.name, category: item.category, brand: item.brand || '', model: item.model || '', location: item.location || '', quantity: item.quantity, condition: item.condition, maxBorrowDays: item.maxBorrowDays, description: item.description || '', isActive: item.isActive }
      : { name: '', category: categories[0]?.name || '', brand: '', model: '', location: '', quantity: 1, condition: 'good', maxBorrowDays: 7, description: '', isActive: true }
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // Preview of the newly chosen photo; the object URL is released when the file changes.
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (e) => {
    e.preventDefault();
    if (!item && !file) return toast.error('Please add a photo of the equipment');
    setSaving(true);
    try {
      const body = toFormData({ ...form, isActive: String(form.isActive) }, { image: file });
      if (item) await api.patch(`/equipment/${item._id}`, body);
      else await api.post('/equipment', body);
      toast.success(item ? 'Equipment updated' : 'Equipment registered');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const shownImage = preview || item?.image;

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? `Edit ${item.equipmentId}` : 'Register equipment'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="equipment-form" loading={saving}>
            {item ? 'Save changes' : 'Register'}
          </Button>
        </>
      }
    >
      <form id="equipment-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label={item ? 'Photo' : 'Photo (required)'} hint={item ? 'Choose a file to replace the current photo.' : 'JPEG, PNG or WebP, up to 4 MB.'} className="sm:col-span-2">
          <div className="flex items-center gap-4">
            {shownImage ? (
              <EquipmentImage key={shownImage} item={{ category: form.category, image: shownImage }} alt="Equipment preview" className="h-20 w-28 shrink-0 rounded border border-slate-200" />
            ) : (
              <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 text-slate-400">
                <ImagePlus size={24} />
              </span>
            )}
            <input className="input" type="file" accept="image/jpeg,image/png,image/webp" required={!item} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </Field>
        <Field label="Name" className="sm:col-span-2">
          <input className="input" required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Category" hint={item ? 'The equipment ID was generated from the original category.' : 'A unique ID is generated automatically.'}>
          <select className="input" value={form.category} onChange={set('category')}>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Total quantity">
          <input className="input" type="number" min="0" required value={form.quantity} onChange={set('quantity')} />
        </Field>
        <Field label="Brand">
          <input className="input" value={form.brand} onChange={set('brand')} />
        </Field>
        <Field label="Model">
          <input className="input" value={form.model} onChange={set('model')} />
        </Field>
        <Field label="Storage location">
          <input className="input" value={form.location} onChange={set('location')} />
        </Field>
        <Field label="Condition">
          <select className="input" value={form.condition} onChange={set('condition')}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Maximum borrowing days">
          <input className="input" type="number" min="1" max="90" required value={form.maxBorrowDays} onChange={set('maxBorrowDays')} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
        </Field>
        {item && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Visible and available for borrowing
          </label>
        )}
      </form>
    </Modal>
  );
}

function BorrowModal({ item, onClose, onCreated }) {
  const toast = useToast();
  const today = new Date();
  const [form, setForm] = useState({ quantity: 1, purpose: '', borrowDate: toDateInput(today), dueDate: toDateInput(addDays(today, Math.min(item.maxBorrowDays, 3))) });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const maxDue = toDateInput(addDays(new Date(form.borrowDate || today), item.maxBorrowDays));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/borrowings', {
        equipment: item._id,
        quantity: Number(form.quantity),
        purpose: form.purpose,
        borrowDate: new Date(`${form.borrowDate}T00:00`).toISOString(),
        dueDate: new Date(`${form.dueDate}T23:59`).toISOString(),
      });
      toast.success('Borrowing request submitted for approval');
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
      title="Request to borrow"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="borrow-form" loading={saving}>
            Submit request
          </Button>
        </>
      }
    >
      <form id="borrow-form" onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-2">
          <EquipmentImage item={item} className="h-14 w-20 shrink-0 rounded" />
          <p className="min-w-0 text-sm">
            <span className="block truncate font-medium">{item.name}</span>
            <span className="block text-xs text-slate-400">
              ID {item.itemNo} - {item.equipmentId}
            </span>
            <span className="block text-xs text-slate-500">
              {item.available} available - up to {item.maxBorrowDays} days
            </span>
          </p>
        </div>
        <Field label="Quantity">
          <input className="input" type="number" min="1" max={item.available} required value={form.quantity} onChange={set('quantity')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pick-up date">
            <input className="input" type="date" required min={toDateInput(today)} value={form.borrowDate} onChange={set('borrowDate')} />
          </Field>
          <Field label="Return by">
            <input className="input" type="date" required min={form.borrowDate} max={maxDue} value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
        <Field label="Purpose">
          <textarea className="input" rows={3} required minLength={3} maxLength={500} value={form.purpose} onChange={set('purpose')} placeholder="e.g. IoT mini project" />
        </Field>
      </form>
    </Modal>
  );
}

export default function Equipment() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const query = useDebounce(q);
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [qr, setQr] = useState(null);
  const [borrowing, setBorrowing] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const categories = useFetch('/equipment/categories').data?.items || [];
  const { data, loading, error, reload } = useFetch('/equipment', {
    params: { q: query || undefined, category: category || undefined, condition: condition || undefined, available: onlyAvailable ? 'true' : undefined, page, limit: 12 },
    watch: ['equipment'],
  });

  const reset = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/equipment/${deleting._id}`);
      toast.success('Equipment deleted');
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
        title="Equipment"
        description="Search the inventory, borrow items and report problems."
        actions={
          isAdmin && (
            <Button icon={Plus} onClick={() => setEditing({})}>
              Register equipment
            </Button>
          )
        }
      />

      <div className="card mb-5 flex flex-wrap items-center gap-2 p-3">
        <SearchInput value={q} onChange={reset(setQ)} placeholder="Search name, ID or brand" className="w-full sm:w-64" />
        <select className="input w-auto py-2" value={category} onChange={(e) => reset(setCategory)(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input w-auto py-2" value={condition} onChange={(e) => reset(setCondition)(e.target.value)} aria-label="Condition">
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => reset(setOnlyAvailable)(e.target.checked)} />
          Available only
        </label>
      </div>
      <ErrorNotice message={error} onRetry={reload} />

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="No equipment found" description="Adjust the filters or search term." />
        </div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {data?.items.map((item) => (
              <motion.article key={item._id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className={`card flex flex-col overflow-hidden ${item.isActive ? '' : 'opacity-60'}`}>
                <EquipmentImage item={item} className="aspect-[4/3] w-full" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold" title={item.name}>
                        {item.name}
                      </h2>
                      <p className="text-xs text-slate-400">
                        ID {item.itemNo} - {item.equipmentId}
                        {!item.isActive && ' - hidden'}
                      </p>
                    </div>
                    <StatusBadge status={item.condition} />
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.category}</p>
                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span>
                      <span className={`text-lg font-bold ${item.available === 0 ? 'text-brand-700' : 'text-slate-900'}`}>{item.available}</span>
                      <span className="text-slate-400"> / {item.quantity} available</span>
                    </span>
                    {item.location && <span className="truncate pl-2 text-xs text-slate-400">{item.location}</span>}
                  </div>
                  {item.damaged > 0 && <p className="text-xs text-brand-700">{item.damaged} unit(s) damaged</p>}
                  <div className="mt-auto flex items-center gap-1 pt-4">
                    <Button size="sm" icon={ClipboardList} className="flex-1" disabled={item.available === 0 || !item.isActive} onClick={() => setBorrowing(item)}>
                      Borrow
                    </Button>
                    <IconButton icon={QrCode} label={`QR code for ${item.name}`} onClick={() => setQr(item)} />
                    <IconButton icon={Wrench} label={`Report issue with ${item.name}`} onClick={() => setReporting(item)} />
                    {isAdmin && (
                      <>
                        <IconButton icon={Pencil} label={`Edit ${item.name}`} onClick={() => setEditing(item)} />
                        <IconButton icon={Trash2} label={`Delete ${item.name}`} onClick={() => setDeleting(item)} className="hover:text-brand-700" />
                      </>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      <div className="card mt-5">
        <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />
      </div>

      {editing && (
        <EquipmentForm
          item={editing._id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {qr && <QrModal equipment={qr} onClose={() => setQr(null)} />}
      {borrowing && (
        <BorrowModal
          item={borrowing}
          onClose={() => setBorrowing(null)}
          onCreated={() => {
            setBorrowing(null);
            reload();
          }}
        />
      )}
      {reporting && <ReportIssueModal equipment={reporting} onClose={() => setReporting(null)} onCreated={() => setReporting(null)} />}
      <ConfirmDialog open={Boolean(deleting)} danger title="Delete equipment" message={`Delete ${deleting?.name} (${deleting?.equipmentId})? This cannot be undone.`} confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDeleting(null)} />
    </>
  );
}
