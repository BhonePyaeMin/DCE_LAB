import { useFetch } from '../hooks/useFetch.js';
import { fmtDate, fmtDateTime } from '../utils/format.js';
import { Modal } from './Modal.jsx';
import { Spinner } from './ui.jsx';

function SignatureBox({ title, name, detail, signedAt, image }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-2 flex h-24 items-center justify-center rounded bg-slate-50">
        <img src={image} alt={`Signature of ${name}`} className="max-h-full max-w-full object-contain" />
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{name}</p>
      <p className="text-xs text-slate-500">{detail}</p>
      <p className="text-xs text-slate-400">{fmtDateTime(signedAt)}</p>
    </div>
  );
}

/** A finished counter transaction: who borrowed what, and both signatures. */
export function ReceiptView({ transaction: t }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Borrowing receipt</p>
          <p className="text-lg font-semibold">{t.code}</p>
        </div>
        <div className="text-right text-sm text-slate-600">
          <p>Borrowed {fmtDateTime(t.assistantSignedAt)}</p>
          <p className="font-medium text-slate-900">Return by {fmtDate(t.dueDate)}</p>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 rounded bg-slate-50 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-400">Student</dt>
          <dd className="font-medium text-slate-900">{t.student?.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Student ID</dt>
          <dd className="font-medium text-slate-900">{t.student?.identifier || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Department</dt>
          <dd>{t.student?.department || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Purpose</dt>
          <dd>{t.purpose || '-'}</dd>
        </div>
      </dl>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">Item ID</th>
            <th className="th">Item</th>
            <th className="th text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {t.items.map((line) => (
            <tr key={line.borrowing}>
              <td className="td font-medium">{line.equipment?.itemNo ?? '-'}</td>
              <td className="td">
                {line.equipment?.name}
                <span className="block text-xs text-slate-400">{line.equipment?.equipmentId}</span>
              </td>
              <td className="td text-right">{line.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-3 sm:grid-cols-2">
        <SignatureBox title="Signed by student" name={t.student?.name} detail={t.student?.identifier || 'Student'} signedAt={t.studentSignedAt} image={t.studentSignature} />
        <SignatureBox title="Signed by lab assistant" name={t.assistant?.name} detail="Approved and handed over" signedAt={t.assistantSignedAt} image={t.assistantSignature} />
      </div>
    </div>
  );
}

/** Loads a receipt by id and shows it in a dialog. */
export function ReceiptModal({ id, onClose }) {
  const { data, loading, error } = useFetch(`/borrowings/transactions/${id}`);
  return (
    <Modal open onClose={onClose} title="Signed receipt" size="lg">
      {loading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && <p className="text-sm text-brand-700">{error}</p>}
      {data && <ReceiptView transaction={data.transaction} />}
    </Modal>
  );
}
