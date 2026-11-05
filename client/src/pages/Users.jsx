import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Button, Card, EmptyState, ErrorNotice, Field, IconButton, PageHeader, Pagination, SearchInput, TableSkeleton } from '../components/ui.jsx';
import { ConfirmDialog, Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROLE_LABEL, fmtDate } from '../utils/format.js';

function UserForm({ target, isSelf, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    target
      ? { name: target.name, role: target.role, identifier: target.identifier || '', department: target.department || '', phone: target.phone || '', isActive: target.isActive, password: '' }
      : { name: '', email: '', role: 'student', identifier: '', department: '', phone: '', isActive: true, password: '' }
  );
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      if (target) {
        await api.patch(`/users/${target._id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      toast.success(target ? 'User updated' : 'User created');
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
      title={target ? 'Edit user' : 'Add user'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {target ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          <input className="input" required value={form.name} onChange={set('name')} />
        </Field>
        {!target && (
          <Field label="Email" className="sm:col-span-2">
            <input className="input" type="email" required value={form.email} onChange={set('email')} />
          </Field>
        )}
        <Field label="Role" hint={isSelf ? 'You cannot change your own role.' : undefined}>
          <select className="input" value={form.role} onChange={set('role')} disabled={isSelf}>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="assistant">Lab assistant</option>
            <option value="admin">Laboratory administrator</option>
          </select>
        </Field>
        <Field label="Student / staff ID">
          <input className="input" value={form.identifier} onChange={set('identifier')} />
        </Field>
        <Field label="Department">
          <input className="input" value={form.department} onChange={set('department')} />
        </Field>
        <Field label="Phone">
          <input className="input" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label={target ? 'Reset password' : 'Password'} hint={target ? 'Leave blank to keep the current password.' : 'At least 8 characters.'} className="sm:col-span-2">
          <input className="input" type="password" autoComplete="new-password" minLength={8} required={!target} value={form.password} onChange={set('password')} />
        </Field>
        {target && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.isActive} disabled={isSelf} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Account is active
          </label>
        )}
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const query = useDebounce(q);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch('/users', { params: { q: query || undefined, role: role || undefined, page, limit: 10 } });

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${deleting._id}`);
      toast.success('User deleted');
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
        title="Users"
        description="Manage accounts, roles and access."
        actions={
          <Button icon={Plus} onClick={() => setEditing({})}>
            Add user
          </Button>
        }
      />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email or ID" className="w-full sm:w-64" />
          <select className="input w-auto py-2" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Role">
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Lecturers</option>
            <option value="assistant">Lab assistants</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
        <ErrorNotice message={error} onRetry={reload} />
        {loading && !data ? (
          <TableSkeleton cols={5} />
        ) : data?.items.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Role</th>
                  <th className="th">ID</th>
                  <th className="th">Status</th>
                  <th className="th">Joined</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {data?.items.map((u) => (
                    <motion.tr key={u._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td className="td">
                        <p className="font-medium text-slate-900">
                          {u.name} {u._id === me._id && <span className="text-xs font-normal text-slate-400">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </td>
                      <td className="td">
                        <StatusBadge status={u.role} label={ROLE_LABEL[u.role]} />
                      </td>
                      <td className="td">{u.identifier || '-'}</td>
                      <td className="td">
                        <StatusBadge status={u.isActive ? 'active' : 'closed'} label={u.isActive ? 'Active' : 'Deactivated'} />
                      </td>
                      <td className="td">{fmtDate(u.createdAt)}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <IconButton icon={Pencil} label={`Edit ${u.name}`} onClick={() => setEditing(u)} />
                          <IconButton icon={Trash2} label={`Delete ${u.name}`} disabled={u._id === me._id} onClick={() => setDeleting(u)} className="hover:text-brand-700 disabled:opacity-30" />
                        </div>
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

      {editing && (
        <UserForm
          target={editing._id ? editing : null}
          isSelf={editing._id === me._id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} danger title="Delete user" message={`Delete ${deleting?.name}? Users with reservations, borrowing or reports cannot be deleted - deactivate them instead.`} confirmLabel="Delete" loading={busy} onConfirm={remove} onClose={() => setDeleting(null)} />
    </>
  );
}
