import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CircleCheck, ClipboardSignature, Minus, Plus, Search, ShieldAlert, ShieldCheck, Trash2, UserSearch } from 'lucide-react';
import { addDays, endOfDay } from 'date-fns';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Card, EmptyState, Field, PageHeader, SearchInput, Segmented, Spinner } from '../components/ui.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EquipmentImage } from '../components/EquipmentImage.jsx';
import { QrScanner } from '../components/QrScanner.jsx';
import { SignaturePad } from '../components/SignaturePad.jsx';
import { ReceiptView } from '../components/Receipt.jsx';
import { fmtDate, ROLE_LABEL, toDateInput } from '../utils/format.js';
import { parseItemCode } from '../utils/qr.js';

const STEPS = ['Student ID', 'Borrow items', 'Student signature', 'Assistant signature'];
const DEFAULT_LOAN_DAYS = 7;

function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Stepper({ step }) {
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Borrowing steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                done ? 'bg-emerald-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? <Check size={16} /> : n}
            </span>
            <span className={`text-xs leading-tight sm:text-sm ${active ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className="hidden text-slate-400 sm:block sm:text-xs">Step {n}</span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StudentSummary({ student }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {[
        ['Name', student.name],
        ['Student ID', student.identifier || '-'],
        ['Department', student.department || '-'],
        ['Email', student.email],
      ].map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-slate-400">{k}</dt>
          <dd className="truncate font-medium text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ItemsTable({ lines }) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">Item ID</th>
            <th className="th">Item</th>
            <th className="th text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ equipment: e, quantity }) => (
            <tr key={e._id}>
              <td className="td font-semibold">{e.itemNo}</td>
              <td className="td">{e.name}</td>
              <td className="td text-right">{quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------- Step 1 ---------------------------------- */

function StudentStep({ student, onSelect }) {
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const { data, loading } = useFetch('/borrowings/counter/students', { params: { q: debounced || undefined } });
  const results = data?.items || [];

  const submit = (e) => {
    e.preventDefault();
    const typed = q.trim().toLowerCase();
    const exact = results.find((s) => s.identifier?.toLowerCase() === typed) || (results.length === 1 ? results[0] : null);
    if (exact) onSelect(exact);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <form onSubmit={submit}>
          <label className="label" htmlFor="student-search">
            Enter or select the Student ID
          </label>
          <SearchInput value={q} onChange={setQ} placeholder="Student ID, name or email" />
        </form>
        <div className="mt-3 max-h-[26rem] overflow-y-auto rounded border border-slate-200">
          {loading && !data ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6" />
            </div>
          ) : results.length === 0 ? (
            <EmptyState icon={UserSearch} title="No student found" description="Check the Student ID and try again." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((s) => {
                const selected = student?._id === s._id;
                return (
                  <li key={s._id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${selected ? 'bg-brand-50' : ''}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{s.name}</span>
                        <span className="block text-xs text-slate-500">{s.identifier || s.email}</span>
                      </span>
                      {s.eligible ? selected ? <Check size={18} className="text-brand-600" /> : null : <StatusBadge status="rejected" label="Blocked" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        <p className="label">Verify the student</p>
        {student ? (
          <div className="rounded border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <StatusBadge status={student.role} label={ROLE_LABEL[student.role]} />
              {student.eligible ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <ShieldCheck size={16} /> Authorized to borrow
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium text-brand-700">
                  <ShieldAlert size={16} /> Cannot borrow
                </span>
              )}
            </div>
            <StudentSummary student={student} />
            <p className="mt-3 text-sm text-slate-500">
              Currently borrowing <span className="font-medium text-slate-900">{student.activeItems}</span> item(s).
            </p>
            {!student.eligible && <p className="mt-3 rounded bg-brand-50 px-3 py-2 text-sm text-brand-800">{student.reason}.</p>}
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">Select a student to see their details.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Step 2 ---------------------------------- */

function ItemPicker({ lines, onAdd }) {
  const toast = useToast();
  const [method, setMethod] = useState('scan');
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const { data, loading } = useFetch('/borrowings/counter/items', { params: { q: debounced || undefined, limit: 50 }, enabled: method === 'select' });

  /** QR scan: the label carries the Item ID, which is looked up in the database. */
  const onScan = useCallback(
    async (text) => {
      const code = parseItemCode(text);
      if (!code) {
        toast.error('That QR code is not a DCE Lab equipment label');
        return false;
      }
      try {
        const res = await api.get(`/equipment/code/${encodeURIComponent(code)}`);
        return onAdd(res.data.equipment);
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [onAdd, toast]
  );

  return (
    <div>
      <Segmented
        label="item-method"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'scan', label: 'Scan QR code' },
          { value: 'select', label: 'Select Item ID' },
        ]}
      />
      <div className="mt-4">
        {method === 'scan' ? (
          <QrScanner onScan={onScan} />
        ) : (
          <div>
            <SearchInput value={q} onChange={setQ} placeholder="Search by Item ID or item name" />
            <div className="mt-3 max-h-[24rem] overflow-auto rounded border border-slate-200">
              {loading && !data ? (
                <div className="flex justify-center py-10">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : data?.items.length === 0 ? (
                <EmptyState icon={Search} title="No items found" description="Try a different ID or name." />
              ) : (
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr>
                      <th className="th">Item ID</th>
                      <th className="th">Item name</th>
                      <th className="th">Status</th>
                      <th className="th" />
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items.map((e) => {
                      const added = lines.some((l) => l.equipment._id === e._id);
                      return (
                        <tr key={e._id}>
                          <td className="td font-semibold">{e.itemNo}</td>
                          <td className="td">
                            {e.name}
                            {e.quantity > 1 && <span className="block text-xs text-slate-400">{e.available} of {e.quantity} available</span>}
                          </td>
                          <td className="td">
                            <StatusBadge status={e.status} tone={e.status === 'available' ? 'green' : e.status === 'borrowed' ? 'violet' : 'slate'} />
                          </td>
                          <td className="td text-right">
                            <Button size="sm" variant={added ? 'secondary' : 'primary'} icon={added ? Check : Plus} disabled={e.status !== 'available'} onClick={() => onAdd(e)}>
                              {added ? 'Added' : 'Add'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BorrowList({ lines, onQuantity, onRemove }) {
  return (
    <div>
      <p className="label">Borrowing list ({lines.reduce((n, l) => n + l.quantity, 0)} item{lines.reduce((n, l) => n + l.quantity, 0) === 1 ? '' : 's'})</p>
      {lines.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">Scan a QR code or select an Item ID to add equipment.</div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded border border-slate-200">
          <AnimatePresence initial={false}>
            {lines.map(({ equipment: e, quantity }) => (
              <motion.li key={e._id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-3">
                <EquipmentImage item={e} className="h-12 w-14 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-500">
                    Item ID {e.itemNo}
                    {e.available > 1 && ` - ${e.available} available`}
                  </p>
                </div>
                {e.available > 1 && (
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Fewer" disabled={quantity <= 1} onClick={() => onQuantity(e._id, quantity - 1)} className="rounded border border-slate-300 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                    <button type="button" aria-label="More" disabled={quantity >= e.available} onClick={() => onQuantity(e._id, quantity + 1)} className="rounded border border-slate-300 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                      <Plus size={14} />
                    </button>
                  </div>
                )}
                <button type="button" aria-label={`Remove ${e.name}`} onClick={() => onRemove(e._id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700">
                  <Trash2 size={16} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

/* ------------------------------- Steps 3 and 4 ------------------------------- */

function SigningHeader({ student, lines }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <p className="label">Student</p>
        <div className="rounded border border-slate-200 p-4">
          <StudentSummary student={student} />
        </div>
      </div>
      <div>
        <p className="label">Equipment</p>
        <ItemsTable lines={lines} />
      </div>
    </div>
  );
}

function StudentSignStep({ student, lines, dueDate, setDueDate, purpose, setPurpose, maxDue, signature, setSignature }) {
  return (
    <div className="space-y-5">
      <SigningHeader student={student} lines={lines} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Return by" hint={`Latest allowed date for these items: ${fmtDate(maxDue)}`}>
          <input type="date" className="input" value={dueDate} min={toDateInput(new Date())} max={toDateInput(maxDue)} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Purpose (optional)">
          <input className="input" value={purpose} maxLength={500} placeholder="Laboratory use" onChange={(e) => setPurpose(e.target.value)} />
        </Field>
      </div>
      <p className="rounded bg-slate-50 px-4 py-3 text-sm text-slate-600">
        By signing, <span className="font-medium text-slate-900">{student.name}</span> agrees to borrow the equipment listed above, to take care of it and to return it by the date shown, following the laboratory borrowing rules.
      </p>
      <SignaturePad label="Signature of the student" value={signature} onChange={setSignature} />
    </div>
  );
}

function AssistantSignStep({ student, lines, dueDate, studentSignature, assistantSignature, setAssistantSignature, confirmed, setConfirmed }) {
  const { user } = useAuth();
  return (
    <div className="space-y-5">
      <SigningHeader student={student} lines={lines} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-slate-200 p-3">
          <p className="text-xs text-slate-400">Signed by the student</p>
          <img src={studentSignature} alt={`Signature of ${student.name}`} className="mt-1 h-16 object-contain" />
        </div>
        <div className="rounded border border-slate-200 p-3 text-sm">
          <p className="text-xs text-slate-400">Approving lab assistant</p>
          <p className="mt-1 font-medium text-slate-900">{user.name}</p>
          <p className="text-slate-500">{ROLE_LABEL[user.role]}</p>
          <p className="mt-1 text-slate-500">Return by {fmtDate(dueDate)}</p>
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded border border-slate-200 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>I checked the student, the items and their Item IDs, and the equipment has been physically handed over to the student.</span>
      </label>
      <SignaturePad label="Signature of the lab assistant" value={assistantSignature} onChange={setAssistantSignature} />
    </div>
  );
}

/* ----------------------------------- Page ----------------------------------- */

export default function Counter() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState(null);
  const [lines, setLines] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [studentSignature, setStudentSignature] = useState(null);
  const [assistantSignature, setAssistantSignature] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const maxLoanDays = useMemo(() => (lines.length ? Math.min(...lines.map((l) => l.equipment.maxBorrowDays)) : DEFAULT_LOAN_DAYS), [lines]);
  const maxDue = useMemo(() => addDays(new Date(), maxLoanDays), [maxLoanDays]);

  // The list is mirrored in a ref so a scan can check it synchronously, before React re-renders.
  const linesRef = useRef([]);
  const commit = useCallback((next) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  /** Adds one unit of an item to the borrowing list. Returns true when it was added (used by the scanner). */
  const addEquipment = useCallback(
    (e) => {
      if (!e.isActive) {
        toast.error(`${e.name} (ID ${e.itemNo}) is not in service`);
        return false;
      }
      if (e.available < 1) {
        toast.error(`${e.name} (ID ${e.itemNo}) is already borrowed or unavailable`);
        return false;
      }
      const current = linesRef.current;
      const existing = current.find((l) => l.equipment._id === e._id);
      if (existing && existing.quantity >= e.available) {
        toast.info(`${e.name} (ID ${e.itemNo}) is already in the borrowing list`);
        return false;
      }
      commit(existing ? current.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l)) : [...current, { equipment: e, quantity: 1 }]);
      toast.success(`${e.name} (ID ${e.itemNo}) added`);
      return true;
    },
    [commit, toast]
  );

  const setQuantity = (id, quantity) => commit(linesRef.current.map((l) => (l.equipment._id === id ? { ...l, quantity } : l)));
  const removeLine = (id) => commit(linesRef.current.filter((l) => l.equipment._id !== id));

  const goToStudentSignature = () => {
    // Pick a sensible return date the first time, and keep it inside the limit if items changed.
    if (!dueDate || new Date(`${dueDate}T23:59:59`) > endOfDay(maxDue)) setDueDate(toDateInput(addDays(new Date(), Math.min(maxLoanDays, DEFAULT_LOAN_DAYS))));
    setStep(3);
  };

  const finalize = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/borrowings/counter', {
        student: student._id,
        items: lines.map((l) => ({ equipment: l.equipment._id, quantity: l.quantity })),
        purpose: purpose.trim() || undefined,
        dueDate: endOfDay(new Date(`${dueDate}T00:00:00`)).toISOString(),
        studentSignature,
        assistantSignature,
      });
      setReceipt(res.data.transaction);
      setStep(5);
      toast.success('Borrowing completed and signed');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setStudent(null);
    commit([]);
    setDueDate('');
    setPurpose('');
    setStudentSignature(null);
    setAssistantSignature(null);
    setConfirmed(false);
    setReceipt(null);
  };

  const canContinue = {
    1: Boolean(student?.eligible),
    2: lines.length > 0,
    3: Boolean(studentSignature && dueDate),
    4: Boolean(assistantSignature && confirmed),
  }[step];

  const next = () => (step === 2 ? goToStudentSignature() : step === 4 ? finalize() : setStep(step + 1));

  return (
    <>
      <PageHeader title="Lab counter" description="Borrow equipment in person: identify the student, add the items, then collect both signatures." />

      {step === 5 ? (
        <Card>
          <div className="mb-5 flex flex-col items-center text-center">
            <CircleCheck size={44} className="text-emerald-600" />
            <h2 className="mt-2 text-lg font-semibold">Borrowing completed</h2>
            <p className="text-sm text-slate-500">Both signatures are saved and the items are now marked as Borrowed.</p>
          </div>
          <ReceiptView transaction={receipt} />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button icon={ClipboardSignature} onClick={reset}>
              New borrowing
            </Button>
            <Link to="/borrowings" className="inline-flex items-center rounded border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Borrowing records
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <Stepper step={step} />
          <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
            {step === 1 && <StudentStep student={student} onSelect={setStudent} />}
            {step === 2 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <ItemPicker lines={lines} onAdd={addEquipment} />
                <div className="space-y-4">
                  <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Borrower</p>
                    <p className="text-sm font-medium text-slate-900">
                      {student.name} <span className="font-normal text-slate-500">({student.identifier || student.email})</span>
                    </p>
                  </div>
                  <BorrowList lines={lines} onQuantity={setQuantity} onRemove={removeLine} />
                </div>
              </div>
            )}
            {step === 3 && <StudentSignStep student={student} lines={lines} dueDate={dueDate} setDueDate={setDueDate} purpose={purpose} setPurpose={setPurpose} maxDue={maxDue} signature={studentSignature} setSignature={setStudentSignature} />}
            {step === 4 && (
              <AssistantSignStep
                student={student}
                lines={lines}
                dueDate={dueDate}
                studentSignature={studentSignature}
                assistantSignature={assistantSignature}
                setAssistantSignature={setAssistantSignature}
                confirmed={confirmed}
                setConfirmed={setConfirmed}
              />
            )}
          </motion.div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" icon={ArrowLeft} disabled={step === 1 || submitting} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <div className="flex items-center gap-3">
              {step === 1 && student && !student.eligible && <span className="hidden text-sm text-brand-700 sm:block">This student cannot borrow right now.</span>}
              <Button icon={step === 4 ? Check : ArrowRight} loading={submitting} disabled={!canContinue} onClick={next}>
                {step === 1 ? 'Continue' : step === 2 ? 'Continue to signature' : step === 3 ? 'Continue to lab assistant' : 'Confirm and finish'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

