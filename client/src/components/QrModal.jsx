import { Download, Printer } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { Button, Spinner } from './ui.jsx';
import { Modal } from './Modal.jsx';

export function QrModal({ equipment, onClose }) {
  const { data, loading, error } = useFetch(`/equipment/${equipment._id}/qr`);

  const print = () => {
    const win = window.open('', '_blank', 'width=420,height=560');
    if (!win) return;
    // Text is inserted via textContent so equipment names can never inject markup.
    win.document.title = `QR ${equipment.equipmentId}`;
    win.document.body.style.cssText = 'font-family:system-ui,sans-serif;text-align:center;padding:24px';
    const img = win.document.createElement('img');
    img.src = data.dataUrl;
    img.style.width = '280px';
    const name = win.document.createElement('p');
    name.textContent = equipment.name;
    name.style.cssText = 'font-size:18px;font-weight:600;margin:8px 0 2px';
    const code = win.document.createElement('p');
    code.textContent = equipment.equipmentId;
    code.style.cssText = 'font-size:14px;color:#475569;margin:0';
    win.document.body.append(img, name, code);
    img.onload = () => win.print();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Equipment QR code"
      size="sm"
      footer={
        data && (
          <>
            <a href={data.dataUrl} download={`${equipment.equipmentId}.png`} className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download size={16} /> Download
            </a>
            <Button icon={Printer} onClick={print}>
              Print label
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        {loading && <Spinner className="my-12" />}
        {error && <p className="text-sm text-brand-700">{error}</p>}
        {data && (
          <>
            <img src={data.dataUrl} alt={`QR code for ${equipment.equipmentId}`} className="h-56 w-56 border border-slate-200" />
            <p className="mt-3 font-semibold">{equipment.name}</p>
            <p className="text-sm text-slate-500">{data.code}</p>
            <p className="mt-2 max-w-xs break-all text-xs text-slate-400">{data.url}</p>
          </>
        )}
      </div>
    </Modal>
  );
}
