import { ChangeEvent, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { downloadMediaProfil, uploadMediaProfil } from '../../api/profilBureauEtude';
import { ProfilPublicBureauEtudeDTO } from '../../types';
import { extractErrorMessage } from '../../lib/utils';
import { ProfilMediaCropModal } from './ProfilMediaCropModal';

interface Props {
  profil: ProfilPublicBureauEtudeDTO;
  disabled?: boolean;
  onUpdated: (profil: ProfilPublicBureauEtudeDTO) => void;
}

const publicMediaUrl = (id?: number) => id ? `/api/public/profil-media/${id}` : undefined;

function mediaExtension(contentType: string) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/jpeg') return 'jpg';
  return 'webp';
}

function mediaStatusLabel(type: 'LOGO' | 'BANNIERE', busy: 'LOGO' | 'BANNIERE' | null, documentId?: number) {
  if (busy === type) return 'Chargement…';
  if (documentId) return 'Cliquer pour recadrer';
  return type === 'LOGO' ? 'Choisir le logo' : 'Choisir le bandeau';
}

export function ProfilBureauEtudeMedia({ profil, disabled, onUpdated }: Readonly<Props>) {
  const [busy, setBusy] = useState<'LOGO' | 'BANNIERE' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ type: 'LOGO' | 'BANNIERE'; file: File } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const inputFor = (type: 'LOGO' | 'BANNIERE') => type === 'LOGO' ? logoInputRef.current : bannerInputRef.current;

  const select = (type: 'LOGO' | 'BANNIERE', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const maxBytes = type === 'LOGO' ? 1024 * 1024 : 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`L’image ne doit pas dépasser ${type === 'LOGO' ? '1 Mo' : '4 Mo'}.`);
      return;
    }
    setError(null);
    setSelection({ type, file });
  };

  const openEditor = async (type: 'LOGO' | 'BANNIERE', documentId?: number) => {
    if (!documentId) {
      inputFor(type)?.click();
      return;
    }
    setBusy(type);
    setError(null);
    try {
      const blob = await downloadMediaProfil(documentId);
      const extension = mediaExtension(blob.type);
      setSelection({ type, file: new File([blob], `${type.toLowerCase()}-actuel.${extension}`, { type: blob.type }) });
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Impossible de charger cette image.'));
    } finally {
      setBusy(null);
    }
  };

  const upload = async (type: 'LOGO' | 'BANNIERE', file: File) => {
    setSelection(null);
    setBusy(type);
    setError(null);
    try {
      onUpdated(await uploadMediaProfil(type, file));
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Impossible d’enregistrer cette image.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="identite-visuelle-title" className="space-y-4">
      <div><h2 id="identite-visuelle-title" className="text-sm font-bold text-stone-900">Identité visuelle</h2><p className="mt-1 text-xs text-stone-500">Le logo et le bandeau apparaissent sur votre fiche publique.</p></div>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div>
          <span className="mb-1 block text-[11px] font-bold text-stone-700">Logo carré · 1 Mo max.</span>
          <button type="button" aria-label={profil.logoDocumentId ? 'Recadrer le logo' : 'Choisir le logo'} disabled={disabled || busy != null} onClick={() => void openEditor('LOGO', profil.logoDocumentId)} className="group flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 transition hover:border-[#779649] disabled:opacity-60">
            {profil.logoDocumentId ? <img src={publicMediaUrl(profil.logoDocumentId)} alt="Logo actuel" className="h-full w-full object-contain" /> : <ImagePlus className="h-8 w-8 text-stone-400" />}
          </button>
          <input ref={logoInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || busy != null} onChange={event => select('LOGO', event)} />
          <span className="mt-1 block text-center text-[11px] font-semibold text-[#688239]">{mediaStatusLabel('LOGO', busy, profil.logoDocumentId)}</span>
        </div>
        <div>
          <span className="mb-1 block text-[11px] font-bold text-stone-700">Bandeau 4:1 · 4 Mo max.</span>
          <button type="button" aria-label={profil.banniereDocumentId ? 'Recadrer le bandeau' : 'Choisir le bandeau'} disabled={disabled || busy != null} onClick={() => void openEditor('BANNIERE', profil.banniereDocumentId)} className="group flex aspect-[4/1] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-gradient-to-r from-[#26311c] to-[#779649] transition hover:border-[#779649] disabled:opacity-60">
            {profil.banniereDocumentId ? <img src={publicMediaUrl(profil.banniereDocumentId)} alt="Bandeau actuel" className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-white/70" />}
          </button>
          <input ref={bannerInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || busy != null} onChange={event => select('BANNIERE', event)} />
          <span className="mt-1 block text-center text-[11px] font-semibold text-[#688239]">{mediaStatusLabel('BANNIERE', busy, profil.banniereDocumentId)}</span>
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {selection && <ProfilMediaCropModal file={selection.file} type={selection.type} onCancel={() => setSelection(null)} onChangeSource={() => inputFor(selection.type)?.click()} onConfirm={file => void upload(selection.type, file)} />}
    </section>
  );
}
