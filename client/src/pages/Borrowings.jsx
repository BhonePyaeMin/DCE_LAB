import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { Card, EmptyState, ErrorNotice, PageHeader, Pagination, Segmented, TableSkeleton } from '../components/ui.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EquipmentImage } from '../components/EquipmentImage.jsx';
import { BorrowingActions } from '../components/BorrowingActions.jsx';
import { ReceiptModal } from '../components/Receipt.jsx';
import { fmtDate } from '../utils/format.js';

const STATUS_FILTERS = ['', 'pending', 'approved', 'borrowed', 'overdue', 'returned', 'damaged', 'rejected', 'cancelled'];

export default function Borrowings() {
  const { isStaff, isLecturer } = useAuth();
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('mine');
  const [page, setPage] = useState(1);
  const [receiptId, setReceiptId] = useState(null);
  const seesAll = isStaff || (isLecturer && scope === 'all');

  const { data, loading, error, reload } = useFetch('/borrowings', {
    params: { status: status || undefined, scope: isLecturer && scope === 'all' ? 'all' : undefined, page, limit: 10 },
    watch: ['borrowings'],
  });

  return (
    <>
      <PageHeader
        title="Equipment borrowing"
        description={isStaff ? 'Review requests, check equipment out and process returns.' : 'Track your borrowing requests and return dates.'}
        actions={
          isLecturer && (
            <Segmented
              label="borrow-scope"
              value={scope}
              onChange={(v) => {
                setScope(v);
                setPage(1);
              }}
              options={[
                { value: 'mine', label: 'My borrowing' },
                { value: 'all', label: 'Student usage' },
              ]}
            />
          )
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
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s ? s[0].toUpperCase() + s.slice(1) : 'All statuses'}
              </option>
            ))}
          </select>
        </div>
        <ErrorNotice message={error} onRetry={reload} />

        {loading && !data ? (
          <TableSkeleton cols={6} />
        ) : data?.items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No borrowing records" description="Borrow equipment from the Equipment page and it will be tracked here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr>
                  <th className="th">Equipment</th>
                  {seesAll && <th className="th">Borrower</th>}
                  <th className="th">Qty</th>
                  <th className="th">Dates</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {data?.items.map((b) => (
                    <motion.tr key={b._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <EquipmentImage item={b.equipment} className="h-11 w-14 shrink-0 rounded" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">{b.equipment?.name}</p>
                            <p className="text-xs text-slate-400">
                              {b.equipment?.itemNo ? `ID ${b.equipment.itemNo} - ` : ''}
                              {b.equipment?.equipmentId}
                            </p>
                          </div>
                        </div>
                      </td>
                      {seesAll && (
                        <td className="td">
                          {b.user?.name}
                          <span className="block text-xs text-slate-400">{b.user?.identifier || b.user?.email}</span>
                        </td>
                      )}
                      <td className="td">{b.quantity}</td>
                      <td className="td whitespace-nowrap text-xs">
                        <span className="block">Pick-up {fmtDate(b.borrowDate)}</span>
                        <span className={`block ${b.isOverdue ? 'font-semibold text-brand-700' : ''}`}>Due {fmtDate(b.dueDate)}</span>
                        {b.returnedAt && <span className="block text-slate-400">Returned {fmtDate(b.returnedAt)}</span>}
                      </td>
                      <td className="td">
                        <StatusBadge status={b.status} />
                        {b.reviewNote && <span className="mt-1 block max-w-[12rem] text-xs text-slate-400">Note: {b.reviewNote}</span>}
                        {b.damagedQuantity > 0 && <span className="mt-1 block text-xs text-brand-700">{b.damagedQuantity} damaged</span>}
                        {b.transaction && (
                          <button type="button" onClick={() => setReceiptId(b.transaction._id)} className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                            <Receipt size={12} /> Signed receipt {b.transaction.code}
                          </button>
                        )}
                      </td>
                      <td className="td">
                        <BorrowingActions borrowing={b} onChanged={reload} />
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
      {receiptId && <ReceiptModal id={receiptId} onClose={() => setReceiptId(null)} />}
    </>
  );
}
