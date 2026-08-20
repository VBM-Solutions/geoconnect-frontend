import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  Landmark,
  LayoutList,
  ListChecks,
  MapPin,
  Mountain,
  Ruler,
  UserRound,
  XCircle,
} from 'lucide-react';
import { EtudeDetailDTO, EtudeDocumentsDTO } from '../../types';
import { TYPE_LABELS } from '../../constants/labels';
import { formatDateLong } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { DocumentList } from './DocumentList';
import { BackButton } from '../ui/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { EtudeStatusBadge } from './EtudeStatusBadge';
import { EtudeStepper } from './EtudeStepper';

export type EtudeSectionId = 'synthese' | 'progression' | 'documents' | 'dates' | 'paiement' | 'technique' | 'intervenants' | 'description';

export function resolveEtudeSection(section: string | null): EtudeSectionId {
  if (section === 'calendrier') return 'dates';
  if (section === 'documents') return 'documents';
  if (section === 'paiement') return 'paiement';
  return 'synthese';
}

interface EtudeDetailLayoutProps {
  etude: EtudeDetailDTO;
  documents?: EtudeDocumentsDTO;
  error: string | null;
  /** URL de retour vers le tableau de bord */
  backTo: string;
  /** Libelle du titre (ex : "Suivi d'etude" | "Gestion d'etude") */
  headerLabel: string;
  /** Banniere optionnelle "action requise" (rendu different selon le role) */
  actionBanner?: React.ReactNode;
  /** Carte d'informations specifique au role (Bureau | Client) */
  infoCard: React.ReactNode;
  /** Role transmis au stepper */
  etatRole: 'CLIENT' | 'BE';
  /** Fabrique les boutons d'action contextuels dans le stepper */
  renderActions: () => React.ReactNode;
  /** Editeur de la date de rendu prevue a afficher dans la section Dates (optionnel, BE uniquement) */
  dateRenduPrevueEditor?: React.ReactNode;
}

export function EtudeDetailLayout({
  etude,
  documents,
  error,
  backTo,
  headerLabel,
  actionBanner,
  infoCard,
  etatRole,
  renderActions,
  dateRenduPrevueEditor,
}: Readonly<EtudeDetailLayoutProps>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<EtudeSectionId>(() => resolveEtudeSection(searchParams.get('section')));
  const prop = etude.propositionDevis;
  const demande = prop?.demandeDevis;
  const etat = etude.etat;
  const parcelles = demande?.referencesCadastrales?.length ? demande.referencesCadastrales : [];
  const documentCount = countDocuments(documents);
  const hasTechnicalData =
    demande?.superficie != null ||
    demande?.nombreLot != null ||
    demande?.delaiMaxSouhaite != null ||
    parcelles.length > 0;
  const projectTitle = demande?.adresseProjet?.rue || demande?.adresseProjet?.ville || 'Projet geotechnique';
  const projectPlace = [demande?.adresseProjet?.ville, demande?.adresseProjet?.codePostal].filter(Boolean).join(' ');
  const studyType = demande?.type ? TYPE_LABELS[demande.type] ?? demande.type : 'Etude geotechnique';

  const sections = useMemo(
    () => [
      { id: 'synthese' as const, label: 'Synthese', icon: ClipboardList },
      { id: 'progression' as const, label: 'Progression', icon: ListChecks },
      { id: 'documents' as const, label: 'Documents', icon: FolderOpen, count: documentCount },
      { id: 'dates' as const, label: 'Dates', icon: CalendarDays },
      { id: 'paiement' as const, label: 'Paiement', icon: Landmark },
      { id: 'technique' as const, label: 'Technique', icon: Mountain, disabled: !hasTechnicalData },
      { id: 'intervenants' as const, label: etatRole === 'BE' ? 'Client' : 'Bureau', icon: UserRound },
      { id: 'description' as const, label: 'Description', icon: FileText, disabled: !demande?.description },
    ],
    [demande?.description, documentCount, etatRole, hasTechnicalData],
  );

  useEffect(() => {
    setActiveSection(resolveEtudeSection(searchParams.get('section')));
  }, [searchParams]);

  const selectSection = (section: EtudeSectionId) => {
    setActiveSection(section);
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      const target = section === 'dates' ? 'calendrier' : section;
      if (section === 'synthese') next.delete('section');
      else next.set('section', target);
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <BackButton to={backTo} label="Retour au tableau de bord" className="text-slate-500" />

      <header
        className={cn(
          'rounded-2xl border p-5 text-white shadow-lg',
          etatRole === 'BE'
            ? 'border-slate-800/10 bg-linear-to-r from-slate-900 via-slate-800 to-blue-700 shadow-slate-300/60'
            : 'border-blue-100 bg-linear-to-r from-blue-600 via-blue-600 to-cyan-500 shadow-blue-200/70',
        )}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              {headerLabel} #{etude.id}
            </p>
            <h1 className="flex flex-wrap items-center gap-x-2 text-2xl font-bold tracking-tight">
              <MapPin className="h-4 w-4 shrink-0 text-white/70" />
              <span>{projectTitle}</span>
              {projectPlace && <span className="text-sm font-normal text-white/70">{projectPlace}</span>}
            </h1>
            <p className="mt-1 text-sm text-white/90">{studyType}</p>
            {parcelles.length > 0 && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-white/70">
                <Landmark className="h-2.5 w-2.5 shrink-0" />
                {parcelles.join(' - ')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <HeaderMetric label="Intervention" value={formatDateLong(etude.dateIntervention) ?? '-'} />
            <HeaderMetric label="Rendu prevu" value={formatDateLong(etude.dateRenduPrevue) ?? '-'} />
            <EtudeStatusBadge etat={etat} className="self-start border-white/30 bg-white/95 sm:self-center" />
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="gc-surface-panel grid grid-cols-1 gap-4 rounded-2xl p-4 md:p-5 xl:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={section.disabled}
                  onClick={() => selectSection(section.id)}
                  className={cn(
                    'flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-left text-xs font-semibold transition-colors',
                    'xl:w-full',
                    isActive
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50',
                    section.disabled && 'cursor-not-allowed opacity-40 hover:border-transparent hover:bg-white',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{section.label}</span>
                  {section.count != null && section.count > 0 && (
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      {section.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {activeSection === 'synthese' && (
            <SectionPanel title="Synthese du dossier">
              <div className="space-y-4">
                {actionBanner}
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryMetric label="Statut" value={<EtudeStatusBadge etat={etat} />} />
                  <SummaryMetric label="Montant" value={prop?.prix == null ? '-' : `${prop.prix} EUR`} />
                  <SummaryMetric label="Intervention" value={formatDateLong(etude.dateIntervention) ?? '-'} />
                  <SummaryMetric label="Rendu prevu" value={formatDateLong(etude.dateRenduPrevue) ?? '-'} />
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">Progression</h3>
                    <EtudeStepper etat={etat} role={etatRole} renderActions={renderActions} />
                  </div>
                  <div className="min-w-0 space-y-4">{infoCard}</div>
                </div>
              </div>
            </SectionPanel>
          )}

          {activeSection === 'progression' && (
            <SectionPanel title="Progression du dossier">
              <EtudeStepper etat={etat} role={etatRole} renderActions={renderActions} />
            </SectionPanel>
          )}

          {activeSection === 'documents' && (
            <SectionPanel title="Documents">
              <DocumentsSection documents={documents} />
            </SectionPanel>
          )}

          {activeSection === 'dates' && (
            <SectionPanel title="Dates">
              <div className="grid gap-3 md:grid-cols-3">
                <InfoTile label="Intervention" value={formatDateLong(etude.dateIntervention) ?? '-'} icon={<CalendarDays />} />
                <InfoTile
                  label="Rendu prevu"
                  value={dateRenduPrevueEditor ?? formatDateLong(etude.dateRenduPrevue) ?? '-'}
                  icon={<Clock />}
                />
                <InfoTile label="Rendu effectif" value={formatDateLong(etude.dateRendu) ?? '-'} icon={<Clock />} />
              </div>
            </SectionPanel>
          )}

          {activeSection === 'paiement' && (
            <SectionPanel title="Paiement">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Retrouvez ici l'état de clôture financière de l'étude et les actions de paiement disponibles.
                </p>
                <EtudeStepper etat={etat} role={etatRole} renderActions={renderActions} />
              </div>
            </SectionPanel>
          )}

          {activeSection === 'technique' && (
            <SectionPanel title="Terrain et technique">
              <TechniqueSection
                superficie={demande?.superficie}
                nombreLot={demande?.nombreLot}
                delaiMaxSouhaite={demande?.delaiMaxSouhaite}
                parcelles={parcelles}
              />
            </SectionPanel>
          )}

          {activeSection === 'intervenants' && (
            <SectionPanel title={etatRole === 'BE' ? 'Client commanditaire' : 'Bureau d\'etudes'}>
              <div className="max-w-xl">{infoCard}</div>
            </SectionPanel>
          )}

          {activeSection === 'description' && (
            <SectionPanel title="Description">
              <p className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{demande?.description}</p>
            </SectionPanel>
          )}
        </main>
      </div>
    </div>
  );
}

function HeaderMetric({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-right">
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-xs font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryMetric({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function SectionPanel({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:p-5">
      <h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactElement<{ className?: string }>;
}>) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {React.cloneElement(icon, { className: 'h-3.5 w-3.5' })}
        {label}
      </p>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function TechniqueSection({
  superficie,
  nombreLot,
  delaiMaxSouhaite,
  parcelles,
}: Readonly<{
  superficie?: number;
  nombreLot?: number;
  delaiMaxSouhaite?: number;
  parcelles: string[];
}>) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {superficie != null && <InfoTile label="Superficie" value={`${superficie} m2`} icon={<Ruler />} />}
      {nombreLot != null && <InfoTile label="Nombre de lots" value={nombreLot} icon={<LayoutList />} />}
      {delaiMaxSouhaite != null && <InfoTile label="Delai souhaite" value={`${delaiMaxSouhaite} sem`} icon={<Clock />} />}
      {parcelles.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 md:col-span-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <Landmark className="h-3.5 w-3.5" />
            References cadastrales
          </p>
          <div className="flex flex-wrap gap-1.5">
            {parcelles.map((ref) => (
              <span key={ref} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsSection({ documents }: Readonly<{ documents?: EtudeDocumentsDTO }>) {
  if (!documents || countDocuments(documents) === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Aucun document disponible pour cette etude.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.documentsDemandeDevis.length > 0 && (
        <DocumentGroup title="Documents de la demande">
          <DocumentList documents={documents.documentsDemandeDevis} showCard={false} />
        </DocumentGroup>
      )}
      {documents.devisPdf && (
        <DocumentGroup title="Devis (proposition)">
          <DocumentList documents={[documents.devisPdf]} showCard={false} />
        </DocumentGroup>
      )}
      {documents.devisSigne && (
        <DocumentGroup title="Devis signe">
          <DocumentList documents={[documents.devisSigne]} showCard={false} />
        </DocumentGroup>
      )}
      {documents.rapport && (
        <DocumentGroup title="Rapport final">
          <DocumentList documents={[documents.rapport]} showCard={false} />
        </DocumentGroup>
      )}
    </div>
  );
}

function DocumentGroup({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <FileText className="h-3 w-3" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">{children}</CardContent>
    </Card>
  );
}

function countDocuments(documents?: EtudeDocumentsDTO) {
  if (!documents) return 0;
  return (
    documents.documentsDemandeDevis.length +
    Number(Boolean(documents.devisPdf)) +
    Number(Boolean(documents.devisSigne)) +
    Number(Boolean(documents.rapport))
  );
}

/** Spinner de chargement partage */
export function EtudeDetailLoadingSpinner() {
  return (
    <div className="flex justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
    </div>
  );
}
