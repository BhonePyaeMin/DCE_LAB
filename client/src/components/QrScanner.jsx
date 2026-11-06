import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { Camera, CameraOff, ImageUp, SwitchCamera } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Spinner } from './ui.jsx';

const BACK_CAMERA = /back|rear|environment|world/i;

// The scanner library is only needed where a scanner is shown, so it is loaded on demand.
const loadScanner = () => import('html5-qrcode');

/** Turns the many shapes of camera errors (strings and DOMExceptions) into a message a person can act on. */
function cameraErrorMessage(err) {
  const text = String(err?.name ? `${err.name} ${err.message || ''}` : err || '');
  if (/NotAllowed|Permission|denied/i.test(text)) return 'Camera permission was denied. Allow camera access for this site in your browser settings, then try again.';
  if (/NotFound|Requested device not found|No camera|no cameras/i.test(text)) return 'No camera was found on this device. Use "Take or choose a photo" or enter the ID instead.';
  if (/NotReadable|TrackStart|in use|Could not start video/i.test(text)) return 'The camera is being used by another app or tab. Close it and try again.';
  if (/Overconstrained|Constraint/i.test(text)) return 'This camera could not be started with the requested settings.';
  return 'The camera could not be started. Try again, or use a photo or the ID.';
}

/**
 * Camera (laptop webcam or phone rear camera) and photo QR scanner.
 * `onScan(text)` may return true when it accepted the code; with `stopOnSuccess` the camera then stops.
 * The same code is not reported twice within a few seconds because the camera sees every frame.
 */
export const QrScanner = forwardRef(function QrScanner({ onScan, stopOnSuccess = false }, ref) {
  const toast = useToast();
  const uid = useId().replace(/:/g, '');
  const readerId = `qr-reader-${uid}`;
  const fileReaderId = `qr-file-${uid}`;
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const scannerRef = useRef(null);
  const last = useRef({ text: '', at: 0 });
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* the camera was already released */
    }
  }, []);

  const handleText = useCallback(
    async (text) => {
      const now = Date.now();
      if (last.current.text === text && now - last.current.at < 3000) return;
      last.current = { text, at: now };
      const accepted = await onScanRef.current?.(text);
      if (accepted === true) {
        navigator.vibrate?.(60);
        if (stopOnSuccess) await stop();
      }
    },
    [stop, stopOnSuccess]
  );

  const start = useCallback(
    async (preferredId) => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        toast.error('The camera needs a secure (HTTPS) connection and a browser that supports it. You can still use a photo or the ID.');
        return;
      }
      await stop();
      setScanning(true);
      setStarting(true);
      // The reader element must be visible and laid out before the camera is attached to it.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await loadScanner();
        const scanner = new Html5Qrcode(readerId, {
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

        // Try the chosen camera first, then generic facing modes for browsers that hide camera ids.
        const attempts = [chosen, { facingMode: 'environment' }, { facingMode: 'user' }].filter(Boolean);
        let started = false;
        let lastError;
        for (const source of attempts) {
          try {
            await scanner.start(source, config, (text) => void handleText(text), () => {});
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
        await stop();
        toast.error(cameraErrorMessage(err));
      } finally {
        setStarting(false);
      }
    },
    [handleText, readerId, stop, toast]
  );

  // Scanning a photo works everywhere, including browsers or devices where the live camera is unavailable.
  const scanPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let text;
    try {
      const { Html5Qrcode } = await loadScanner();
      const reader = new Html5Qrcode(fileReaderId, { verbose: false });
      try {
        text = await reader.scanFile(file, false);
      } finally {
        reader.clear();
      }
    } catch {
      toast.error('No QR code was found in that photo. Try again with a sharper, closer photo.');
      return;
    }
    last.current = { text: '', at: 0 };
    const accepted = await onScanRef.current?.(text);
    if (accepted === true && stopOnSuccess) await stop();
  };

  useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);
  useEffect(() => () => void stop(), [stop]);

  return (
    <div className="space-y-4">
      <div className={scanning ? 'relative' : 'hidden'}>
        <div id={readerId} className="min-h-[16rem] overflow-hidden rounded border border-slate-200 bg-slate-900" />
        {starting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded bg-slate-900/80 text-sm text-white">
            <Spinner className="text-white" /> Starting camera...
          </div>
        )}
      </div>
      <div id={fileReaderId} className="hidden" />

      {!scanning && (
        <div className="flex flex-col items-center rounded border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          <Camera size={28} className="mb-2 text-slate-400" />
          Point your camera at a QR label.
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
                  start(e.target.value);
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
          <Button variant="secondary" icon={CameraOff} className="w-full" onClick={stop}>
            Stop camera
          </Button>
        </div>
      ) : (
        <Button icon={Camera} className="w-full" loading={starting} onClick={() => start()}>
          Start camera
        </Button>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
        <ImageUp size={16} /> Take or choose a photo
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={scanPhoto} />
      </label>
    </div>
  );
});
