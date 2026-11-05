import { useState } from 'react';
import { Ban, Check, LogIn, LogOut, X } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field } from './ui.jsx';
import { ConfirmDialog, Modal } from './Modal.jsx';

/** Row actions for a borrowing record. Which buttons appear depends on the status and the viewer's role. */
export function BorrowingActions({ borrowing, onChanged }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'return' | 'cancel'
  const [note, setNote] = useState('');
  const [damaged, setDamaged] = useState(0);
  const [busy, setBusy] = useState(false);

  const isOwner = borrowing.user?._id === user._id;
  const { status } = borrowing;

  const run = async (request, success) => {
    setBusy(true);
    try {
      await request();
      toast.success(success);
      setDialog(null);
      setNote('');
      setDamaged(0);
      onChanged?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const id = borrowing._id;
  const close = () => setDialog(null);

  return (
    <>
      <div className="flex flex-wrap justify-end gap-1.5">
        {isAdmin && status === 'pending' && !isOwner && (
          <>
            <Button size="sm" icon={Check} onClick={() => setDialog('approve')}>
              Approve
            </Button>
            <Button size="sm" variant="danger" icon={X} onClick={() => setDialog('reject')}>
              Reject
            </Button>
          </>
        )}
        {isAdmin && status === 'approved' && (
          <Button size="sm" icon={LogOut} loading={busy} onClick={() => run(() => api.patch(`/borrowings/${id}/collect`), 'Equipment checked out')}>
            Check out
          </Button>
        )}
        {isAdmin && ['borrowed', 'overdue'].includes(status) && (
          <Button size="sm" icon={LogIn} onClick={() => setDialog('return')}>
            Process return
          </Button>
        )}
        {(isOwner || isAdmin) && ['pending', 'approved'].includes(status) && (
          <Button size="sm" variant="secondary" icon={Ban} onClick={() => setDialog('cancel')}>
            Cancel
          </Button>
        )}
      </div>

      <Modal
        open={dialog === 'approve' || dialog === 'reject'}
        onClose={close}
        size="sm"
        title={dialog === 'approve' ? 'Approve borrowing request' : 'Reject borrowing request'}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant={dialog === 'approve' ? 'primary' : 'danger'}
              loading={busy}
              onClick={() => run(() => api.patch(`/borrowings/${id}/review`, { status: dialog === 'approve' ? 'approved' : 'rejected', note: note || undefined }), dialog === 'approve' ? 'Request approved' : 'Request rejected')}
            >
              {dialog === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {borrowing.user?.name} - {borrowing.quantity} x {borrowing.equipment?.name}
        </p>
        <Field label="Note (optional)" className="mt-4">
          <textarea className="input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Modal>

      <Modal
        open={dialog === 'return'}
        onClose={close}
        size="sm"
        title="Process return"
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => run(() => api.patch(`/borrowings/${id}/return`, { damagedQuantity: Number(damaged), note: note || undefined }), Number(damaged) ? 'Return recorded with damage' : 'Return recorded')}>
              Confirm return
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {borrowing.user?.name} is returning {borrowing.quantity} x {borrowing.equipment?.name}.
        </p>
        <Field label="Units returned damaged" hint="Damaged units are held back from stock and a maintenance report is created." className="mt-4">
          <input className="input" type="number" min="0" max={borrowing.quantity} value={damaged} onChange={(e) => setDamaged(e.target.value)} />
        </Field>
        <Field label="Condition notes" className="mt-4">
          <textarea className="input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Modal>

      <ConfirmDialog
        open={dialog === 'cancel'}
        danger
        title="Cancel request"
        message={`Cancel the request for ${borrowing.quantity} x ${borrowing.equipment?.name}?`}
        confirmLabel="Cancel request"
        loading={busy}
        onConfirm={() => run(() => api.patch(`/borrowings/${id}/cancel`), 'Request cancelled')}
        onClose={close}
      />
    </>
  );
}
