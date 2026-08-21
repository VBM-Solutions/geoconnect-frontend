import { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { Crop, LoaderCircle, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { calculateCropPlacement, clampPan, cropImage, panAfterDrag } from './mediaCrop';

interface Props {
  file: File;
  type: 'LOGO' | 'BANNIERE';
  onCancel: () => void;
  onConfirm: (file: File) => void;
  onChangeSource: () => void;
}

export function ProfilMediaCropModal({ file, type, onCancel, onConfirm, onChangeSource }: Readonly<Props>) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState('');
  const viewportRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const previewWidth = type === 'LOGO' ? 320 : 720;
  const previewHeight = type === 'LOGO' ? 320 : 180;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !processing) onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onCancel, processing]);

  const placement = image ? calculateCropPlacement(
    image.naturalWidth, image.naturalHeight, previewWidth, previewHeight, zoom, panX, panY,
  ) : null;

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!image || processing) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX, panY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const drag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = dragRef.current;
    const viewport = viewportRef.current;
    if (!origin || origin.pointerId !== event.pointerId || !placement || !viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const logicalDeltaX = (event.clientX - origin.x) * previewWidth / bounds.width;
    const logicalDeltaY = (event.clientY - origin.y) * previewHeight / bounds.height;
    setPanX(panAfterDrag(origin.panX, logicalDeltaX, previewWidth, placement.width / previewWidth - 1));
    setPanY(panAfterDrag(origin.panY, logicalDeltaY, previewHeight, placement.height / previewHeight - 1));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const reset = () => { setZoom(1); setPanX(0); setPanY(0); };
  const moveWithKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const movements: Record<string, [number, number]> = {
      ArrowLeft: [-.05, 0], ArrowRight: [.05, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05],
    };
    const movement = movements[event.key];
    if (!movement) return;
    event.preventDefault();
    setPanX(current => clampPan(current + movement[0]));
    setPanY(current => clampPan(current + movement[1]));
  };

  const confirm = async () => {
    if (!image) return;
    setProcessing(true);
    setError(null);
    try {
      onConfirm(await cropImage(image, type, zoom, panX, panY));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de recadrer cette image.');
      setProcessing(false);
    }
  };

  return (
    <dialog open aria-modal="true" aria-labelledby="crop-title" className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-stone-950/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-[#faf9f6] p-5 shadow-2xl sm:p-7">
        <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#688239]">Identité visuelle</p><h2 id="crop-title" className="mt-1 text-xl font-black text-stone-950">Recadrer {type === 'LOGO' ? 'le logo' : 'le bandeau'}</h2><p className="mt-1 text-sm text-stone-500">Déplacez et zoomez l’image pour définir la zone visible.</p></div><button type="button" aria-label="Fermer" disabled={processing} onClick={onCancel} className="rounded-full p-2 text-stone-500 hover:bg-stone-200"><X className="h-5 w-5" /></button></header>
        <div className="mt-5 flex justify-center rounded-2xl bg-[#26311c] p-4 sm:p-6">
          <button type="button" ref={viewportRef} aria-label="Aperçu du recadrage, déplaçable avec les flèches" onKeyDown={moveWithKeyboard} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onWheel={event => { event.preventDefault(); setZoom(current => Math.max(1, Math.min(3, current - event.deltaY * .002))); }} className={`relative block max-w-full touch-none cursor-grab overflow-hidden border-0 bg-stone-200 p-0 shadow-inner outline-none ring-[#a9bc83] focus:ring-4 active:cursor-grabbing ${type === 'LOGO' ? 'aspect-square w-80 rounded-2xl' : 'aspect-[4/1] w-[720px] rounded-xl'}`}>
            {objectUrl && <img src={objectUrl} alt="Aperçu à recadrer" onLoad={event => setImage(event.currentTarget)} onError={() => setError('Ce fichier ne peut pas être lu comme une image.')} className="absolute max-w-none select-none" draggable={false} style={placement ? { left: `${placement.x / previewWidth * 100}%`, top: `${placement.y / previewHeight * 100}%`, width: `${placement.width / previewWidth * 100}%`, height: `${placement.height / previewHeight * 100}%` } : undefined} />}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-35">{Array.from({ length: 9 }, (_, index) => <span key={index} className="border-[.5px] border-white" />)}</div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/70" />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-bold text-stone-700"><span className="flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" />Zoom</span><span className="mt-2 flex items-center gap-3"><ZoomOut className="h-4 w-4 text-stone-400" /><input aria-label="Zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="w-full accent-[#688239]" /><ZoomIn className="h-4 w-4 text-stone-400" /></span></label>
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100"><RotateCcw className="h-4 w-4" />Recentrer</button>
        </div>
        <p className="mt-3 text-center text-xs text-stone-500">Cliquez et faites glisser l’image · Utilisez la molette pour zoomer</p>
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
        <footer className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button type="button" disabled={processing} onClick={onChangeSource} className="rounded-xl border border-[#a9bc83] bg-[#eef2e6] px-4 py-2.5 text-sm font-bold text-[#526c2c] hover:bg-[#e2ead3]">Changer {type === 'LOGO' ? 'le logo' : 'le bandeau'}</button><div className="flex justify-end gap-3"><button type="button" disabled={processing} onClick={onCancel} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-100">Annuler</button><button type="button" disabled={!image || processing} onClick={() => void confirm()} className="inline-flex items-center gap-2 rounded-xl bg-[#688239] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#526c2c] disabled:opacity-50">{processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />}Utiliser cette image</button></div></footer>
      </div>
    </dialog>
  );
}
