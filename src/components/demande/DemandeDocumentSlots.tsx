import { useRef, useState } from 'react';
import { Download, Eye, FilePlus2, FileText, Loader2, RefreshCw } from 'lucide-react';
import { categoriesForStudy, categoryShortLabel, DocumentCategory } from '../../constants/documentCategories';
import { DemandeDevisDTO, DocumentDTO, EnrichissementDemandeDTO } from '../../types';
import { downloadDocument, openDocument, uploadDocument } from '../../api/document';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  demande: DemandeDevisDTO;
  documents?: DocumentDTO[];
  editable: boolean;
  onSave: (payload: EnrichissementDemandeDTO) => Promise<void>;
}

export function DemandeDocumentSlots({ demande, documents = demande.documentsDevis ?? [], editable, onSave }: Readonly<Props>) {
  const [busy, setBusy] = useState<DocumentCategory | null>(null);
  const [otherLabel, setOtherLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);
  const { toastError } = useToast();
  const categories = categoriesForStudy(demande.type);

  const selectFile = (category: DocumentCategory) => {
    if (category === 'AUTRE' && !otherLabel.trim()) return;
    setSelectedCategory(category);
    inputRef.current?.click();
  };
  const upload = async (file?: File) => {
    if (!file || !selectedCategory || demande.id == null) return;
    setBusy(selectedCategory);
    try {
      const uploaded = await uploadDocument(file);
      if (uploaded.id == null) throw new Error('Document uploadé sans identifiant.');
      const retained = documents
        .filter(doc => selectedCategory === 'AUTRE' || doc.categorieDemande !== selectedCategory)
        .map(doc => ({ documentId: doc.id, categorie: doc.categorieDemande!, precision: doc.precisionCategorieDemande }));
      await onSave({ ...informationPayload(demande), documentsDemande: [...retained, { documentId: uploaded.id, categorie: selectedCategory, precision: selectedCategory === 'AUTRE' ? otherLabel.trim() : undefined }] });
      setOtherLabel('');
    } finally { setBusy(null); setSelectedCategory(null); if (inputRef.current) inputRef.current.value = ''; }
  };

  return <div className="space-y-3">
    <input ref={inputRef} aria-label="Fichier document" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => upload(e.target.files?.[0])} />
    {categories.filter(category => category !== 'AUTRE').map(category => {
      const document = documents.find(doc => doc.categorieDemande === category);
      return <div key={category}><DocumentSlot label={categoryShortLabel(category)} document={document} editable={editable} busy={busy === category} activeDocumentId={activeDocumentId} setActiveDocumentId={setActiveDocumentId} onError={toastError} onSelect={() => selectFile(category)} /></div>;
    })}
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3"><p className="text-sm font-bold text-slate-800">Autres documents</p>{editable && <div className="mt-2 flex gap-2"><input aria-label="Intitulé de l’autre document" maxLength={150} value={otherLabel} onChange={e => setOtherLabel(e.target.value)} placeholder="Précisez le type de document" className="h-9 min-w-0 flex-1 rounded border border-slate-300 px-3 text-sm" /><button type="button" aria-label="Ajouter un autre document" disabled={!otherLabel.trim() || busy !== null} onClick={() => selectFile('AUTRE')} className="rounded bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50"><FilePlus2 className="mr-1 inline h-4 w-4" />Ajouter</button></div>}</div>
      <div className="space-y-2">{documents.filter(doc => !doc.categorieDemande || doc.categorieDemande === 'AUTRE').map(doc => <div key={doc.id}><DocumentSlot label={doc.precisionCategorieDemande || 'Autre document'} document={doc} editable={false} busy={false} activeDocumentId={activeDocumentId} setActiveDocumentId={setActiveDocumentId} onError={toastError} onSelect={() => undefined} /></div>)}{!documents.some(doc => !doc.categorieDemande || doc.categorieDemande === 'AUTRE') && <p className="text-sm italic text-slate-400">Document non fourni</p>}</div>
    </div>
  </div>;
}

interface DocumentSlotProps {
  label: string;
  document?: DocumentDTO;
  editable: boolean;
  busy: boolean;
  activeDocumentId: number | null;
  setActiveDocumentId: (id: number | null) => void;
  onError: (message: string) => void;
  onSelect: () => void;
}

function DocumentSlot({ label, document, editable, busy, activeDocumentId, setActiveDocumentId, onError, onSelect }: Readonly<DocumentSlotProps>) {
  const action = document ? 'Remplacer' : 'Ajouter';
  const fileName = document?.nomTelechargement || document?.nomFichierOriginal || 'Document';
  const handle = async (documentAction: () => void | Promise<void>) => {
    if (document?.id == null) return;
    setActiveDocumentId(document.id);
    try {
      await Promise.resolve(documentAction());
    } catch {
      onError('Impossible d\'ouvrir/télécharger ce document. Veuillez réessayer.');
    } finally {
      setActiveDocumentId(null);
    }
  };
  return <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
    <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{label}</p>{document ? <span className="mt-1 flex max-w-full items-center gap-1 text-sm text-slate-600"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{fileName}</span></span> : <p className="mt-1 text-sm italic text-slate-400">Document non fourni</p>}</div>
    {editable && <button type="button" aria-label={`${action} — ${label}`} disabled={busy} onClick={onSelect} className="shrink-0 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50">{document ? <><RefreshCw className="mr-1 inline h-4 w-4" />Remplacer</> : <><FilePlus2 className="mr-1 inline h-4 w-4" />Ajouter</>}</button>}
    {document && <div className="flex shrink-0 items-center gap-1">
      {activeDocumentId === document.id ? <Loader2 aria-label="Chargement du document" className="m-1 h-4 w-4 animate-spin text-blue-500" /> : <>
        <button type="button" title="Visualiser dans le navigateur" aria-label={`Visualiser ${fileName}`} onClick={() => handle(() => openDocument(document.id!, fileName))} className="rounded p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Eye aria-hidden="true" className="h-4 w-4" /></button>
        <button type="button" title="Télécharger" aria-label={`Télécharger ${fileName}`} onClick={() => handle(() => downloadDocument(document.id!, fileName))} className="rounded p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Download aria-hidden="true" className="h-4 w-4" /></button>
      </>}
    </div>}
  </div>;
}

function informationPayload(d: DemandeDevisDTO): EnrichissementDemandeDTO { return { delaiMaxSouhaite: d.delaiMaxSouhaite, nombreLot: d.nombreLot, referencesCadastrales: d.referencesCadastrales ?? [], superficie: d.superficie, description: d.description, presenceReseaux: d.presenceReseaux ?? 'NE_SAIS_PAS', accessibiliteMachines: d.accessibiliteMachines ?? 'NE_SAIS_PAS' }; }
