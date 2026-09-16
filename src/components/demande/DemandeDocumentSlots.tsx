import { useRef, useState } from 'react';
import { FilePlus2, FileText, RefreshCw } from 'lucide-react';
import { categoriesForStudy, categoryShortLabel, DocumentCategory } from '../../constants/documentCategories';
import { DemandeDevisDTO, DocumentDTO, EnrichissementDemandeDTO } from '../../types';
import { openDocument, uploadDocument } from '../../api/document';

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
      return <div key={category}><DocumentSlot label={categoryShortLabel(category)} document={document} editable={editable} busy={busy === category} onSelect={() => selectFile(category)} /></div>;
    })}
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3"><p className="text-sm font-bold text-slate-800">Autres documents</p>{editable && <div className="mt-2 flex gap-2"><input aria-label="Intitulé de l’autre document" maxLength={150} value={otherLabel} onChange={e => setOtherLabel(e.target.value)} placeholder="Précisez le type de document" className="h-9 min-w-0 flex-1 rounded border border-slate-300 px-3 text-sm" /><button type="button" aria-label="Ajouter un autre document" disabled={!otherLabel.trim() || busy !== null} onClick={() => selectFile('AUTRE')} className="rounded bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50"><FilePlus2 className="mr-1 inline h-4 w-4" />Ajouter</button></div>}</div>
      <div className="space-y-2">{documents.filter(doc => !doc.categorieDemande || doc.categorieDemande === 'AUTRE').map(doc => <div key={doc.id}><DocumentSlot label={doc.precisionCategorieDemande || 'Autre document'} document={doc} editable={false} busy={false} onSelect={() => undefined} /></div>)}{!documents.some(doc => !doc.categorieDemande || doc.categorieDemande === 'AUTRE') && <p className="text-sm italic text-slate-400">Document non fourni</p>}</div>
    </div>
  </div>;
}

function DocumentSlot({ label, document, editable, busy, onSelect }: Readonly<{ label: string; document?: DocumentDTO; editable: boolean; busy: boolean; onSelect: () => void }>) {
  const action = document ? 'Remplacer' : 'Ajouter';
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{label}</p>{document ? <button type="button" onClick={() => document.id != null && openDocument(document.id, document.nomTelechargement)} className="mt-1 flex max-w-full items-center gap-1 text-left text-sm text-blue-700 hover:underline"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{document.nomTelechargement || document.nomFichierOriginal}</span></button> : <p className="mt-1 text-sm italic text-slate-400">Document non fourni</p>}</div>{editable && <button type="button" aria-label={`${action} — ${label}`} disabled={busy} onClick={onSelect} className="shrink-0 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50">{document ? <><RefreshCw className="mr-1 inline h-4 w-4" />Remplacer</> : <><FilePlus2 className="mr-1 inline h-4 w-4" />Ajouter</>}</button>}</div>;
}

function informationPayload(d: DemandeDevisDTO): EnrichissementDemandeDTO { return { delaiMaxSouhaite: d.delaiMaxSouhaite, nombreLot: d.nombreLot, referencesCadastrales: d.referencesCadastrales ?? [], superficie: d.superficie, description: d.description, presenceReseaux: d.presenceReseaux ?? 'NE_SAIS_PAS', accessibiliteMachines: d.accessibiliteMachines ?? 'NE_SAIS_PAS' }; }
