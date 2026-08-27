import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { DevisVersionDTO } from '../../types';
import { getDevisVersions } from '../../api/devisVersion';
import { downloadDocument } from '../../api/document';

export function DevisVersionsCard({ etudeId, refreshKey = 0 }: Readonly<{ etudeId: number; refreshKey?: number }>) {
  const [versions, setVersions] = useState<DevisVersionDTO[]>([]);
  useEffect(() => {
    let active = true;
    getDevisVersions(etudeId)
      .then(result => { if (active) setVersions(result); })
      .catch(() => { if (active) setVersions([]); });
    return () => { active = false; };
  }, [etudeId, refreshKey]);
  if (!versions.length) return null;
  return <div className="rounded-lg border border-slate-200 bg-white p-3">
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Versions du devis</p>
    <div className="space-y-2">{versions.map((v, i) => <button key={v.id} type="button"
      onClick={() => downloadDocument(v.documentId, `devis-V${v.numero}.pdf`)}
      className="flex w-full items-center gap-2 rounded border border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50">
      <FileText className="h-4 w-4 text-blue-600"/><span className="font-bold">V{v.numero}</span>
      <span className="text-slate-500">{v.prix} € · {v.delaiMaxIntervention} sem. / {v.delaiMaxRendu} sem.</span>
      {i === versions.length - 1 && <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-blue-700">Dernière version</span>}
      <Download className="h-3.5 w-3.5"/>
    </button>)}</div>
  </div>;
}
