import { useRef, useState } from 'react';
import { FilePlus2, FileText, Trash2 } from 'lucide-react';
import { categoriesForStudy, DOCUMENT_CATEGORY_LABELS, DocumentCategory, TypedDocumentDraft } from '../../constants/documentCategories';
import { TypeDemandeDevis } from '../../types';

interface Props {
  id: string;
  typeEtude?: TypeDemandeDevis;
  documents: TypedDocumentDraft[];
  onChange: (documents: TypedDocumentDraft[]) => void;
  maxDocuments?: number;
}

export function TypedDocumentUploader({ id, typeEtude, documents, onChange, maxDocuments = 5 }: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [precision, setPrecision] = useState('');
  const [error, setError] = useState('');
  const categories = categoriesForStudy(typeEtude);

  const chooseFile = () => {
    if (!category) return setError('Sélectionnez d’abord le type de document.');
    if (category === 'AUTRE' && !precision.trim()) return setError('Précisez la nature du document.');
    setError('');
    inputRef.current?.click();
  };

  const addFile = (file?: File) => {
    if (!file || !category) return;
    onChange([...documents, {
      key: `${Date.now()}-${file.name}`,
      file,
      categorie: category,
      precision: category === 'AUTRE' ? precision.trim() : undefined,
    }]);
    setCategory('');
    setPrecision('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-5 text-blue-900">
        Pour faciliter les démarches du Bureau d’études géotechniques, communiquez le maximum de documents à votre disposition, particulièrement ceux relatifs à votre parcelle et à son accès.
      </div>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor={`${id}-category`} className="block text-sm font-medium text-slate-700">Type de document</label>
        <select id={`${id}-category`} value={category} onChange={e => { setCategory(e.target.value as DocumentCategory | ''); setError(''); }} className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm">
          <option value="">Document à ajouter</option>
          {categories.map(value => <option key={value} value={value}>{DOCUMENT_CATEGORY_LABELS[value]}</option>)}
        </select>
        {category === 'AUTRE' && (
          <div>
            <label htmlFor={`${id}-precision`} className="mb-1 block text-sm font-medium text-slate-700">Précisez le type de document *</label>
            <input id={`${id}-precision`} value={precision} maxLength={150} onChange={e => setPrecision(e.target.value)} className="h-10 w-full rounded border border-slate-300 px-3 text-sm" placeholder="Ex : diagnostic pollution" />
          </div>
        )}
        <button type="button" onClick={chooseFile} disabled={documents.length >= maxDocuments} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          <FilePlus2 className="h-4 w-4" /> Ajouter un document
        </button>
        <input ref={inputRef} id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { addFile(e.target.files?.[0]); e.target.value = ''; }} />
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        <p className="text-xs text-slate-500">PDF ou image — {documents.length}/{maxDocuments} document(s)</p>
      </div>
      {documents.length > 0 && <ul className="space-y-2">{documents.map(doc => (
        <li key={doc.key} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <span className="min-w-0 text-sm"><span className="flex items-center gap-2 font-medium"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{doc.file.name}</span></span><span className="ml-6 text-xs text-slate-500">{DOCUMENT_CATEGORY_LABELS[doc.categorie]}{doc.precision ? ` — ${doc.precision}` : ''}</span></span>
          <button type="button" aria-label={`Supprimer ${doc.file.name}`} onClick={() => onChange(documents.filter(item => item.key !== doc.key))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </li>
      ))}</ul>}
    </div>
  );
}
