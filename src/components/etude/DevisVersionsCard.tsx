import { useEffect, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { DevisVersionDTO } from '../../types';
import { getDevisVersions } from '../../api/devisVersion';
import { downloadDocument, openDocument } from '../../api/document';

const CACHE_DURATION_MS = 30_000;
const versionCache = new Map<string, { versions: DevisVersionDTO[]; loadedAt: number }>();
const pendingVersionLoads = new Map<string, Promise<DevisVersionDTO[]>>();

function loadVersions(etudeId: number, refreshKey: number) {
  const key = `${etudeId}:${refreshKey}`;
  const cached = versionCache.get(key);
  if (cached && Date.now() - cached.loadedAt < CACHE_DURATION_MS) return Promise.resolve(cached.versions);
  const pending = pendingVersionLoads.get(key);
  if (pending !== undefined) return pending;
  const request = getDevisVersions(etudeId)
    .then(versions => {
      versionCache.set(key, { versions, loadedAt: Date.now() });
      return versions;
    })
    .finally(() => pendingVersionLoads.delete(key));
  pendingVersionLoads.set(key, request);
  return request;
}

export function DevisVersionsCard({ etudeId, refreshKey = 0 }: Readonly<{ etudeId: number; refreshKey?: number }>) {
  const [versions, setVersions] = useState<DevisVersionDTO[]>([]);
  useEffect(() => {
    let active = true;
    loadVersions(etudeId, refreshKey)
      .then(result => { if (active) setVersions(result); })
      .catch(() => { if (active) setVersions([]); });
    return () => { active = false; };
  }, [etudeId, refreshKey]);
  if (!versions.length) return null;
  return <div className="rounded-lg border border-slate-200 bg-white p-3">
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Versions du devis</p>
    <div className="space-y-2">{versions.map((v, i) => {
      const fileName = `devis-V${v.numero}.pdf`;
      return <div key={v.id} className="flex w-full items-center gap-2 rounded border border-slate-100 px-3 py-2 text-left text-xs">
      <FileText className="h-4 w-4 text-blue-600"/><span className="font-bold">V{v.numero}</span>
      <span className="text-slate-500">{v.prix} € · {v.delaiMaxIntervention} sem. / {v.delaiMaxRendu} sem.</span>
      {i === versions.length - 1 && <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-blue-700">Dernière version</span>}
      {i !== versions.length - 1 && <span className="ml-auto" />}
      <span className="flex shrink-0 items-center gap-1">
        <button type="button" title="Visualiser dans le navigateur" aria-label={`Visualiser ${fileName}`} onClick={() => openDocument(v.documentId, fileName)} className="rounded p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Eye aria-hidden="true" className="h-3.5 w-3.5" /></button>
        <button type="button" title="Télécharger" aria-label={`Télécharger ${fileName}`} onClick={() => downloadDocument(v.documentId, fileName)} className="rounded p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Download aria-hidden="true" className="h-3.5 w-3.5" /></button>
      </span>
    </div>})}</div>
  </div>;
}
