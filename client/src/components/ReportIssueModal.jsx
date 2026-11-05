import { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import api, { errorMessage, toFormData } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Field } from './ui.jsx';
import { Modal } from './Modal.jsx';

/** Damage / malfunction report with optional photos. `equipment` pre-selects an item. */
export function ReportIssueModal({ equipment, onClose, onCreated }) {
  const toast = useToast();
  const options = useFetch('/equipment', { params: { limit: 100 }, enabled: !equipment }).data?.items || [];
  const [form, setForm] = useState({ equipment: equipment?._id || '', title: '', description: '', severity: 'medium' });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length > 3) toast.error('You can attach up to 3 photos');
    setFiles(picked.slice(0, 3));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/maintenance', toFormData(form, { images: files }));
      toast.success('Report submitted. The laboratory team has been notified.');
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
      title="Report an equipment issue"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="issue-form" loading={saving} disabled={!form.equipment}>
            Submit report
          </Button>
        </>
      }
    >
      <form id="issue-form" onSubmit={submit} className="space-y-4">
        <Field label="Equipment">
          {equipment ? (
            <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {equipment.name} <span className="text-slate-400">({equipment.equipmentId})</span>
            </p>
          ) : (
            <select className="input" required value={form.equipment} onChange={set('equipment')}>
              <option value="">Select equipment</option>
              {options.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name} ({o.equipmentId})
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Summary">
          <input className="input" required minLength={3} maxLength={140} value={form.title} onChange={set('title')} placeholder="e.g. Screen flickers when powered on" />
        </Field>
        <Field label="Details">
          <textarea className="input" rows={4} required minLength={5} maxLength={1500} value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Severity">
          <select className="input" value={form.severity} onChange={set('severity')}>
            <option value="low">Low - cosmetic or minor</option>
            <option value="medium">Medium - partially working</option>
            <option value="high">High - unusable or unsafe</option>
          </select>
        </Field>
        <Field label="Photos (optional)" hint="Up to 3 images, 5 MB each.">
          <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
            <ImagePlus size={18} />
            {files.length ? `${files.length} photo(s) selected` : 'Choose images'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={pickFiles} />
          </label>
        </Field>
      </form>
    </Modal>
  );
}
