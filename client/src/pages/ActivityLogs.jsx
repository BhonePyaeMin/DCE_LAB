import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { Card, EmptyState, ErrorNotice, PageHeader, Pagination, TableSkeleton } from '../components/ui.jsx';
import { fmtDateTime } from '../utils/format.js';

const ENTITIES = ['User', 'Laboratory', 'Equipment', 'Reservation', 'Borrowing', 'Maintenance'];

export default function ActivityLogs() {
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/users/activity-logs', { params: { entity: entity || undefined, page, limit: 20 } });

  return (
    <>
      <PageHeader title="Activity log" description="Audit trail of important actions across the system." />
      <Card padded={false}>
        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
          <select className="input w-auto py-1.5" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} aria-label="Filter by record type">
            <option value="">All record types</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <ErrorNotice message={error} onRetry={reload} />
        {loading && !data ? (
          <TableSkeleton cols={4} />
        ) : data?.items.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity recorded" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="th">Time</th>
                  <th className="th">User</th>
                  <th className="th">Action</th>
                  <th className="th">Details</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((a) => (
                  <tr key={a._id}>
                    <td className="td whitespace-nowrap text-xs">{fmtDateTime(a.createdAt)}</td>
                    <td className="td">
                      {a.user?.name || 'System'}
                      <span className="block text-xs text-slate-400">{a.user?.role}</span>
                    </td>
                    <td className="td">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{a.action}</code>
                    </td>
                    <td className="td">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />
      </Card>
    </>
  );
}
