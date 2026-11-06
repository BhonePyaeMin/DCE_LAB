import { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Button } from './ui.jsx';

const MIN_STROKE_LENGTH = 40; // a stray tap is not a signature

/**
 * Canvas where a person signs with a finger, pen or mouse. Calls `onChange` with a PNG data URL once a real
 * signature has been drawn, and with null when it is cleared. A previous `value` is redrawn when the pad
 * is shown again (for example when stepping back in a wizard).
 */
export function SignaturePad({ label, value, onChange, className = '' }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const length = useRef(0);
  const lastPoint = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;
  const [signed, setSigned] = useState(Boolean(value));

  // Size the bitmap to the element (sharp on high-density screens) and redraw any saved signature.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let width = 0;
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || Math.round(rect.width) === width) return;
      width = Math.round(rect.width);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      if (valueRef.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = valueRef.current;
      }
    };
    setup();
    const observer = new ResizeObserver(setup);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    length.current = 0;
    const p = point(e);
    lastPoint.current = p;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
  };

  const onMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const from = lastPoint.current;
    const to = point(e);
    // Smooth the line by curving through the midpoint of consecutive points.
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    length.current += Math.hypot(to.x - from.x, to.y - from.y);
    lastPoint.current = to;
  };

  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (length.current >= MIN_STROKE_LENGTH || valueRef.current) {
      setSigned(true);
      onChangeRef.current?.(canvasRef.current.toDataURL('image/png'));
    } else {
      clear();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    valueRef.current = null;
    setSigned(false);
    onChangeRef.current?.(null);
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <Button type="button" variant="ghost" size="sm" icon={Eraser} onClick={clear} disabled={!signed}>
          Clear
        </Button>
      </div>
      <div className="relative rounded border border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          aria-label={`${label}. Draw with your finger, a pen or the mouse.`}
          className="block h-44 w-full cursor-crosshair touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
        {!signed && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-300">Sign here</span>}
        <span className="pointer-events-none absolute inset-x-4 bottom-8 border-b border-dashed border-slate-200" aria-hidden />
      </div>
    </div>
  );
}
