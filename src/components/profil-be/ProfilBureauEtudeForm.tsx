import { DepartementMultiSelect } from '../parametres/DepartementMultiSelect';
import { Input } from '../ui/Input';
import {
  DepartementDTO,
  EnumValueDTO,
  TypeDemandeDevis,
  UpdateProfilPublicBureauEtudePayload,
} from '../../types';

interface ProfilBureauEtudeFormProps {
  value: UpdateProfilPublicBureauEtudePayload;
  typesEtude: EnumValueDTO[];
  departements: DepartementDTO[];
  disabled?: boolean;
  onChange: (value: UpdateProfilPublicBureauEtudePayload) => void;
}

const textareaClass =
  'w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50';

export function ProfilBureauEtudeForm({
  value,
  typesEtude,
  departements,
  disabled = false,
  onChange,
}: Readonly<ProfilBureauEtudeFormProps>) {
  const patch = (changes: Partial<UpdateProfilPublicBureauEtudePayload>) =>
    onChange({ ...value, ...changes });

  const toggleType = (code: TypeDemandeDevis) => {
    const selected = value.typesEtude.includes(code);
    patch({
      typesEtude: selected
        ? value.typesEtude.filter(type => type !== code)
        : [...value.typesEtude, code],
    });
  };

  return (
    <div className="space-y-6">
      <fieldset disabled={disabled} className="space-y-4">
        <legend className="mb-3 text-sm font-bold text-slate-800">Présentation publique</legend>
        <div>
          <label htmlFor="descriptionCourte" className="block text-[11px] font-semibold text-slate-700">
            Présentation courte
          </label>
          <p className="mb-1 text-[10px] text-slate-500">Au moins 40 caractères pour publier, 300 maximum.</p>
          <textarea
            id="descriptionCourte"
            rows={3}
            maxLength={300}
            value={value.descriptionCourte ?? ''}
            onChange={event => patch({ descriptionCourte: event.target.value })}
            className={textareaClass}
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">
            {(value.descriptionCourte ?? '').length}/300
          </p>
        </div>
        <div>
          <label htmlFor="descriptionLongue" className="mb-1 block text-[11px] font-semibold text-slate-700">
            Présentation détaillée
          </label>
          <textarea
            id="descriptionLongue"
            rows={7}
            maxLength={5000}
            value={value.descriptionLongue ?? ''}
            onChange={event => patch({ descriptionLongue: event.target.value })}
            className={textareaClass}
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">
            {(value.descriptionLongue ?? '').length}/5000
          </p>
        </div>
      </fieldset>

      <fieldset disabled={disabled} className="space-y-4">
        <legend className="mb-3 text-sm font-bold text-slate-800">Expertises et zone d’intervention</legend>
        <div>
          <span className="mb-2 block text-[11px] font-semibold text-slate-700">Types d’étude réalisés</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {typesEtude.map(type => {
              const code = type.code as TypeDemandeDevis;
              return (
                <label
                  key={type.code}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2.5 text-xs hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <input
                    type="checkbox"
                    checked={value.typesEtude.includes(code)}
                    onChange={() => toggleType(code)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{type.libelle}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-[11px] font-semibold text-slate-700">Départements couverts</span>
          <DepartementMultiSelect
            id="zonesIntervention"
            departements={departements}
            selectedCodes={value.zonesIntervention}
            onChange={zonesIntervention => patch({ zonesIntervention })}
            disabled={disabled}
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled} className="space-y-4">
        <legend className="mb-3 text-sm font-bold text-slate-800">Coordonnées visibles</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="siteWeb"
            type="url"
            label="Site web"
            placeholder="https://www.exemple.fr"
            value={value.siteWeb ?? ''}
            onChange={event => patch({ siteWeb: event.target.value })}
          />
          <Input
            id="anneesExperience"
            type="number"
            min={0}
            max={200}
            label="Années d’expérience"
            value={value.anneesExperience ?? ''}
            onChange={event => patch({
              anneesExperience: event.target.value === '' ? undefined : Number(event.target.value),
            })}
          />
          <Input
            id="telephonePublic"
            type="tel"
            maxLength={20}
            label="Téléphone public"
            value={value.telephonePublic ?? ''}
            onChange={event => patch({ telephonePublic: event.target.value })}
          />
          <Input
            id="emailPublic"
            type="email"
            label="E-mail public"
            value={value.emailPublic ?? ''}
            onChange={event => patch({ emailPublic: event.target.value })}
          />
        </div>
        <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={value.afficherAdresseComplete}
            onChange={event => patch({ afficherAdresseComplete: event.target.checked })}
            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <strong className="block">Afficher mon adresse complète</strong>
            <span className="block">
              Sinon, seuls la ville et le département seront visibles sur la page publique.
            </span>
          </span>
        </label>
      </fieldset>
    </div>
  );
}
