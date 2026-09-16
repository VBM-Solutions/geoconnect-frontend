import { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { DemandeDevisDTO, EnrichissementDemandeDTO, TerrainAnswer } from '../../types';
import { Button } from '../ui/Button';
import { CadastralReferencesField } from '../ui/CadastralReferencesField';
import { normalizeReferencesCadastrales } from '../../lib/cadastralReferences';

interface Props {
  demande: DemandeDevisDTO;
  editable: boolean;
  onSave: (payload: EnrichissementDemandeDTO) => Promise<void>;
}

const terrainOptions: Array<{ value: TerrainAnswer; label: string }> = [
  { value: 'OUI', label: 'Oui' }, { value: 'NON', label: 'Non' }, { value: 'NE_SAIS_PAS', label: 'Ne sait pas' },
];

export function DemandeInformationEditor({ demande, editable, onSave }: Readonly<Props>) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => fromDemande(demande));
  useEffect(() => setForm(fromDemande(demande)), [demande]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        delaiMaxSouhaite: positiveNumber(form.delaiMaxSouhaite),
        nombreLot: positiveNumber(form.nombreLot),
        superficie: nonNegativeNumber(form.superficie),
        referencesCadastrales: normalizeReferencesCadastrales(form.referencesCadastrales),
        description: form.description.trim() || undefined,
        presenceReseaux: form.presenceReseaux,
        accessibiliteMachines: form.accessibiliteMachines,
      });
      setEditing(false);
    } finally { setSaving(false); }
  };

  if (!editing) return (
    <div className="space-y-4">
      {editable && <div className="flex justify-end"><Button variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />Modifier</Button></div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Value label="Superficie" value={demande.superficie == null ? 'Non renseignée' : `${demande.superficie} m²`} />
        <Value label="Nombre de lots" value={demande.nombreLot ?? 'Non renseigné'} />
        <Value label="Délai souhaité" value={demande.delaiMaxSouhaite == null ? 'Non renseigné' : `${demande.delaiMaxSouhaite} semaines`} />
        <Value label="Présence de réseaux sur la parcelle" value={terrainLabel(demande.presenceReseaux)} />
        <Value label="Accès du terrain pour des machines" value={terrainLabel(demande.accessibiliteMachines)} />
        <Value label="Références cadastrales" value={demande.referencesCadastrales?.length ? demande.referencesCadastrales.join(', ') : 'Non renseignées'} />
      </div>
      <Value label="Description" value={demande.description || 'Non renseignée'} multiline />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Superficie (m²)" value={form.superficie} onChange={value => setForm({ ...form, superficie: value })} type="number" />
        <Field label="Nombre de lots" value={form.nombreLot} onChange={value => setForm({ ...form, nombreLot: value })} type="number" />
        <Field label="Délai souhaité (semaines)" value={form.delaiMaxSouhaite} onChange={value => setForm({ ...form, delaiMaxSouhaite: value })} type="number" />
        <SelectField label="Présence de réseaux" value={form.presenceReseaux} onChange={value => setForm({ ...form, presenceReseaux: value })} />
        <SelectField label="Accès des machines" value={form.accessibiliteMachines} onChange={value => setForm({ ...form, accessibiliteMachines: value })} />
      </div>
      <CadastralReferencesField value={form.referencesCadastrales} onChange={referencesCadastrales => setForm({ ...form, referencesCadastrales })} />
      <label className="block text-xs font-semibold text-slate-700">Description<textarea maxLength={2000} rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm" /></label>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setForm(fromDemande(demande)); setEditing(false); }}><X className="mr-2 h-4 w-4" />Annuler</Button><Button onClick={save} isLoading={saving}><Save className="mr-2 h-4 w-4" />Enregistrer</Button></div>
    </div>
  );
}

function Value({ label, value, multiline = false }: Readonly<{ label: string; value: string | number; multiline?: boolean }>) { return <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-sm text-slate-800 ${multiline ? 'whitespace-pre-wrap' : 'font-semibold'}`}>{value}</p></div>; }
function Field({ label, value, onChange, type = 'text' }: Readonly<{ label: string; value: string; onChange: (value: string) => void; type?: string }>) { return <label className="block text-xs font-semibold text-slate-700">{label}<input type={type} min="0" value={value} onChange={e => onChange(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>; }
function SelectField({ label, value, onChange }: Readonly<{ label: string; value: TerrainAnswer; onChange: (value: TerrainAnswer) => void }>) { return <label className="block text-xs font-semibold text-slate-700">{label}<select value={value} onChange={e => onChange(e.target.value as TerrainAnswer)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{terrainOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function fromDemande(d: DemandeDevisDTO) { return { superficie: d.superficie?.toString() ?? '', nombreLot: d.nombreLot?.toString() ?? '', delaiMaxSouhaite: d.delaiMaxSouhaite?.toString() ?? '', referencesCadastrales: d.referencesCadastrales?.length ? [...d.referencesCadastrales] : [''], description: d.description ?? '', presenceReseaux: d.presenceReseaux ?? 'NE_SAIS_PAS' as TerrainAnswer, accessibiliteMachines: d.accessibiliteMachines ?? 'NE_SAIS_PAS' as TerrainAnswer }; }
function positiveNumber(value: string) { const result = Number(value); return value && result > 0 ? result : undefined; }
function nonNegativeNumber(value: string) { const result = Number(value); return value && result >= 0 ? result : undefined; }
function terrainLabel(value?: TerrainAnswer) { return terrainOptions.find(option => option.value === value)?.label ?? 'Ne sait pas'; }
