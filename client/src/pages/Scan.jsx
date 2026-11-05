import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CameraOff, MapPin, QrCode, Search, Wrench } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import { EquipmentImage } from '../components/EquipmentImage.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, EmptyState, Spinner, PageHeader } from '../components/ui.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { BorrowingActions } from '../components/BorrowingActions.jsx';
import { ReportIssueModal } from '../components/ReportIssueModal.jsx';
import { fmtDate } from '../utils/format.js';

const CODE_PATTERN = /EQ-[A-Z]+-\d{4,}/i;
const READER_ID = 'qr-reader';

function ScanResult({ code }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/equipment/code/${encodeURIComponent(code)}`);
      setState({ loading: false, error: '', data: res.data });
    } catch (err) {
      setState({ loading: false, error: errorMessage(err), data: null });
    }
  }, [code]);

  useEffect(() => {
    setState({ loading: true, error: '', data: null });
    load();
  }, [load]);

  if (state.loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (state.error) return <EmptyState icon={QrCode} title="Equipment not found" description={state.error} />;

  const { equipment: e, borrowings } = state.data;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex gap-4">
        <EquipmentImage item={e} className="h-24 w-32 shrink-0 rounded" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{e.name}</h2>
          <p className="text-sm text-slate-500">
            {e.equipmentId} - {e.category}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={e.condition} />
            <span className={`text-sm font-medium ${e.available === 0 ? 'text-brand-700' : 'text-emerald-700'}`}>
              {e.available} of {e.quantity} available
            </span>
          </div>
          {e.location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={14} /> {e.location}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" icon={Wrench} onClick={() => setReporting(true)}>
          Report an issue
        </Button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Current borrowing records</h3>
        {borrowings.length === 0 ? (
          <p className="rounded border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">No active borrowing records for this item.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded border border-slate-200">
            {borrowings.map((b) => (
              <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {b.user?.name} <span className="font-normal text-slate-400">x {b.quantity}</span>
                  </p>
                  <p className="text-xs text-slate-500">Due {fmtDate(b.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <BorrowingActions borrowing={b} onChanged={load} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {reporting && <ReportIssueModal equipment={e} onClose={() => setReporting(false)} onCreated={() => setReporting(false)} />}
    </motion.div>
  );
}

export default function Scan() {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [manual, setManual] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const code = routeCode?.toUpperCase();

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* the camera was already released */
    }
  }, []);

  const handleDecoded = useCallback(
    async (text) => {
      const match = String(text).match(CODE_PATTERN);
      if (!match) return toast.error('This QR code is not a DCE Lab equipment label');
      await stopScanner();
      setScanning(false);
      navigate(`/scan/${match[0].toUpperCase()}`);
    },
    [navigate, stopScanner, toast]
  );

  const startScanner = async () => {
    setScanning(true);
    // Wait for the reader element to mount before attaching the camera.
    await new Promise((r) => setTimeout(r, 50));
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, handleDecoded, () => {});
    } catch (err) {
      setScanning(false);
      scannerRef.current = null;
      toast.error(typeof err === 'string' ? err : 'Camera unavailable. Check permissions or enter the code manually.');
    }
  };

  useEffect(() => () => void stopScanner(), [stopScanner]);

  const submitManual = (e) => {
    e.preventDefault();
    const match = manual.match(CODE_PATTERN);
    if (!match) return toast.error('Enter a code like EQ-MCU-0001');
    navigate(`/scan/${match[0].toUpperCase()}`);
    setManual('');
  };

  return (
    <>
      <PageHeader title="QR scanner" description="Scan an equipment label to see its details, availability and borrowing records." />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card title="Scan a label">
          <div className="space-y-4">
            <div id={READER_ID} className={`overflow-hidden rounded border border-slate-200 ${scanning ? '' : 'hidden'}`} />
            {!scanning && (
              <div className="flex flex-col items-center rounded border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                <Camera size={28} className="mb-2 text-slate-400" />
                Point your camera at an equipment QR label.
              </div>
            )}
            {scanning ? (
              <Button variant="secondary" icon={CameraOff} className="w-full" onClick={async () => { await stopScanner(); setScanning(false); }}>
                Stop camera
              </Button>
            ) : (
              <Button icon={Camera} className="w-full" onClick={startScanner}>
                Start camera
              </Button>
            )}
            <form onSubmit={submitManual} className="border-t border-slate-100 pt-4">
              <label className="label" htmlFor="manual-code">
                Or enter the equipment ID
              </label>
              <div className="flex gap-2">
                <input id="manual-code" className="input" placeholder="EQ-MCU-0001" value={manual} onChange={(e) => setManual(e.target.value)} />
                <Button type="submit" variant="secondary" icon={Search} aria-label="Look up" />
              </div>
            </form>
          </div>
        </Card>

        <Card title="Result">
          <AnimatePresence mode="wait">
            <motion.div key={code || 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {code ? <ScanResult code={code} /> : <EmptyState icon={QrCode} title="Nothing scanned yet" description="Scan a label or enter an equipment ID to look it up." />}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </>
  );
}
