import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CameraOff, ImageUp, MapPin, QrCode, Search, SwitchCamera, Wrench } from 'lucide-react';
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
const FILE_READER_ID = 'qr-file-reader';
const BACK_CAMERA = /back|rear|environment|world/i;

// The scanner library is only needed on this page, so it is loaded on demand.
const loadScanner = () => import('html5-qrcode');

/** Turns the many shapes of camera errors (strings and DOMExceptions) into a message a person can act on. */
function cameraErrorMessage(err) {
  const text = String(err?.name ? `${err.name} ${err.message || ''}` : err || '');
  if (/NotAllowed|Permission|denied/i.test(text)) return 'Camera permission was denied. Allow camera access for this site in your browser settings, then try again.';
  if (/NotFound|Requested device not found|No camera|no cameras/i.test(text)) return 'No camera was found on this device. Use "Take or choose a photo" or enter the equipment ID instead.';
  if (/NotReadable|TrackStart|in use|Could not start video/i.test(text)) return 'The camera is being used by another app or tab. Close it and try again.';
  if (/Overconstrained|Constraint/i.test(text)) return 'This camera could not be started with the requested settings.';
  return 'The camera could not be started. Try again, or use a photo or the equipment ID.';
}

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
  const [starting, setStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const scannerRef = useRef(null);
  const lastWarning = useRef(0);
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

  /** Shared by the live camera, photo upload and manual entry. */
  const openCode = useCallback(
    async (text) => {
      const match = String(text).match(CODE_PATTERN);
      if (!match) {
        // The camera reports every frame, so rate-limit the warning for unrelated QR codes.
        if (Date.now() - lastWarning.current > 3000) {
          lastWarning.current = Date.now();
          toast.error('That QR code is not a DCE Lab equipment label');
        }
        return false;
      }
      await stopScanner();
      setScanning(false);
      navigator.vibrate?.(60);
      navigate(`/scan/${match[0].toUpperCase()}`);
      return true;
    },
    [navigate, stopScanner, toast]
  );

  const startScanner = useCallback(
    async (preferredId) => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        toast.error('The camera needs a secure (HTTPS) connection and a browser that supports it. You can still use a photo or the equipment ID.');
        return;
      }
      await stopScanner();
      setScanning(true);
      setStarting(true);
      // The reader element must be visible and laid out before the camera is attached to it.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await loadScanner();
        const scanner = new Html5Qrcode(READER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        scannerRef.current = scanner;

        // Listing cameras also triggers the permission prompt. Phones prefer the rear camera; laptops use their webcam.
        const list = await Html5Qrcode.getCameras();
        setCameras(list);
        const chosen = preferredId || list.find((c) => BACK_CAMERA.test(c.label))?.id || list[list.length - 1]?.id;

        const config = {
          fps: 12,
          qrbox: (width, height) => {
            const side = Math.max(160, Math.floor(Math.min(width, height) * 0.7));
            return { width: side, height: side };
          },
        };
        const onDecoded = (text) => void openCode(text);

        // Try the chosen camera first, then generic facing modes for browsers that hide camera ids.
        const attempts = [chosen, { facingMode: 'environment' }, { facingMode: 'user' }].filter(Boolean);
        let started = false;
        let lastError;
        for (const source of attempts) {
          try {
            await scanner.start(source, config, onDecoded, () => {});
            if (typeof source === 'string') setCameraId(source);
            started = true;
            break;
          } catch (err) {
            lastError = err;
            if (/NotAllowed|Permission|denied/i.test(String(lastError?.name || lastError))) break;
          }
        }
        if (!started) throw lastError || new Error('Could not start the camera');
      } catch (err) {
        await stopScanner();
        setScanning(false);
        toast.error(cameraErrorMessage(err));
      } finally {
        setStarting(false);
      }
    },
    [openCode, stopScanner, toast]
  );

  // Scanning a photo works everywhere, including browsers or devices where the live camera is unavailable.
  const scanPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await stopScanner();
    setScanning(false);
    try {
      const { Html5Qrcode } = await loadScanner();
      const reader = new Html5Qrcode(FILE_READER_ID, { verbose: false });
      try {
        const text = await reader.scanFile(file, false);
        await openCode(text);
      } finally {
        reader.clear();
      }
    } catch {
      toast.error('No QR code was found in that photo. Try again with a sharper, closer photo.');
    }
  };

  useEffect(() => () => void stopScanner(), [stopScanner]);

  const submitManual = async (e) => {
    e.preventDefault();
    const match = manual.match(CODE_PATTERN);
    if (!match) return toast.error('Enter a code like EQ-MCU-0001');
    await stopScanner();
    setScanning(false);
    navigate(`/scan/${match[0].toUpperCase()}`);
    setManual('');
  };

  const scanAnother = () => {
    navigate('/scan');
    startScanner();
  };

  return (
    <>
      <PageHeader title="QR scanner" description="Scan an equipment label with your laptop or phone camera to see its details, availability and borrowing records." />
      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card title="Scan a label">
          <div className="space-y-4">
            <div className={scanning ? 'relative' : 'hidden'}>
              <div id={READER_ID} className="min-h-[16rem] overflow-hidden rounded border border-slate-200 bg-slate-900" />
              {starting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded bg-slate-900/80 text-sm text-white">
                  <Spinner className="text-white" /> Starting camera...
                </div>
              )}
            </div>
            <div id={FILE_READER_ID} className="hidden" />

            {!scanning && (
              <div className="flex flex-col items-center rounded border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                <Camera size={28} className="mb-2 text-slate-400" />
                Point your camera at an equipment QR label.
                <span className="mt-1 text-xs text-slate-400">Hold it about 15-25 cm away in good light.</span>
              </div>
            )}

            {scanning ? (
              <div className="space-y-2">
                {cameras.length > 1 && (
                  <div className="flex items-center gap-2">
                    <SwitchCamera size={16} className="shrink-0 text-slate-400" />
                    <select
                      className="input py-1.5"
                      aria-label="Choose camera"
                      value={cameraId}
                      onChange={(e) => {
                        setCameraId(e.target.value);
                        startScanner(e.target.value);
                      }}
                    >
                      {cameras.map((c, i) => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  variant="secondary"
                  icon={CameraOff}
                  className="w-full"
                  onClick={async () => {
                    await stopScanner();
                    setScanning(false);
                  }}
                >
                  Stop camera
                </Button>
              </div>
            ) : (
              <Button icon={Camera} className="w-full" loading={starting} onClick={() => startScanner()}>
                Start camera
              </Button>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              <ImageUp size={16} /> Take or choose a photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={scanPhoto} />
            </label>

            <form onSubmit={submitManual} className="border-t border-slate-100 pt-4">
              <label className="label" htmlFor="manual-code">
                Or enter the equipment ID
              </label>
              <div className="flex gap-2">
                <input id="manual-code" className="input" placeholder="EQ-MCU-0001" value={manual} onChange={(e) => setManual(e.target.value)} autoCapitalize="characters" />
                <Button type="submit" variant="secondary" icon={Search} aria-label="Look up" />
              </div>
            </form>
          </div>
        </Card>

        <Card
          title="Result"
          actions={
            code && (
              <Button size="sm" variant="secondary" icon={Camera} onClick={scanAnother}>
                Scan another
              </Button>
            )
          }
        >
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
