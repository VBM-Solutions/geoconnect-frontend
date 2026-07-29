import { Building2, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import {
  DepartementDTO,
  EnumValueDTO,
  ProfilPublicBureauEtudeDTO,
  UpdateProfilPublicBureauEtudePayload,
} from '../../types';
import { extractCodeDepartement } from '../../lib/utils';

interface ProfilBureauEtudePreviewProps {
  profil: ProfilPublicBureauEtudeDTO;
  draft: UpdateProfilPublicBureauEtudePayload;
  typesEtude: EnumValueDTO[];
  departements: DepartementDTO[];
}

export function ProfilBureauEtudePreview({
  profil,
  draft,
  typesEtude,
  departements,
}: Readonly<ProfilBureauEtudePreviewProps>) {
  const typeLabels = new Map(typesEtude.map(type => [type.code, type.libelle]));
  const departementLabels = new Map(departements.map(departement => [departement.code, departement.libelle]));
  const address = profil.adresse;
  const addressLabel = draft.afficherAdresseComplete
    ? [address?.rue, address?.codePostal, address?.ville].filter(Boolean).join(', ')
    : [address?.ville, extractCodeDepartement(address?.codePostal)].filter(Boolean).join(' · ');

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 px-6 py-8 text-white">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/10 p-3">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Bureau d’études</p>
            <h2 className="mt-1 text-2xl font-bold">{profil.raisonSociale}</h2>
            {addressLabel && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-200">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {addressLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <h3 className="text-lg font-bold text-slate-900">
            {draft.descriptionCourte || 'Votre présentation courte apparaîtra ici'}
          </h3>
          {draft.descriptionLongue && (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
              {draft.descriptionLongue}
            </p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Expertises</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.typesEtude.length > 0
              ? draft.typesEtude.map(code => (
                <span key={code} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {typeLabels.get(code) ?? code}
                </span>
              ))
              : <p className="text-xs text-slate-400">Aucun type d’étude sélectionné.</p>}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Zones d’intervention</h3>
          <p className="mt-2 text-sm text-slate-700">
            {draft.zonesIntervention.length > 0
              ? draft.zonesIntervention.map(code => departementLabels.get(code) ?? code).join(', ')
              : 'Aucune zone sélectionnée.'}
          </p>
        </section>

        <section className="grid gap-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
          {draft.telephonePublic && (
            <p className="flex items-center gap-2 text-slate-700"><Phone className="h-4 w-4 text-blue-600" />{draft.telephonePublic}</p>
          )}
          {draft.emailPublic && (
            <p className="flex items-center gap-2 text-slate-700"><Mail className="h-4 w-4 text-blue-600" />{draft.emailPublic}</p>
          )}
          {draft.siteWeb && (
            <p className="flex items-center gap-2 text-slate-700"><ExternalLink className="h-4 w-4 text-blue-600" />{draft.siteWeb}</p>
          )}
          {draft.anneesExperience != null && (
            <p className="text-slate-700"><strong>{draft.anneesExperience}</strong> années d’expérience</p>
          )}
        </section>
      </div>
    </article>
  );
}
