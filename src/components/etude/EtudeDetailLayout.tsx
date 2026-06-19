import React from 'react';
import { EtudeDetailDTO, EtudeDocumentsDTO } from '../../types';
import { formatDateLong } from '../../lib/formatters';
import { DocumentList } from './DocumentList';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BackButton } from '../ui/BackButton';
import { EtudeStatusBadge } from './EtudeStatusBadge';
import { EtudeStepper } from './EtudeStepper';
import { MapPin, FileText, XCircle, Clock, Landmark, Mountain, Ruler, LayoutList } from 'lucide-react';
import { TYPE_LABELS } from '../../constants/labels';

interface EtudeDetailLayoutProps {
  etude: EtudeDetailDTO;
  documents?: EtudeDocumentsDTO;
  error: string | null;
  /** URL de retour vers le tableau de bord */
  backTo: string;
  /** Libellé du titre (ex : "Suivi d'étude" | "Gestion d'étude") */
  headerLabel: string;
  /** Bannière optionnelle "action requise" (rendu différent selon le rôle) */
  actionBanner?: React.ReactNode;
  /** Carte d'informations spécifique au rôle (Bureau | Client) */
  infoCard: React.ReactNode;
  /** Rôle transmis au stepper */
  etatRole: 'CLIENT' | 'BE';
  /** Fabrique les boutons d'action contextuels dans le stepper */
  renderActions: () => React.ReactNode;
  /** Éditeur de la date de rendu prévue à afficher dans la carte Dates (optionnel, BE uniquement) */
  dateRenduPrevueEditor?: React.ReactNode;
}

/**
 * Mise en page partagée entre la page détail CLIENT et la page détail BE.
 * Seuls varient : le lien de retour, le libellé d'en-tête, la carte d'infos
 * gauche, la bannière d'action et le libellé du rapport.
 */
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
  const prop    = etude.propositionDevis;
  const demande = prop?.demandeDevis;
  const etat    = etude.etat;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const parcelles: string[] = demande?.referencesCadastrales?.length
    ? demande.referencesCadastrales : [];

  return (
    <div className="space-y-6">
      <BackButton to={backTo} label="Retour au tableau de bord" className="text-slate-500" />

      {/* En-tête */}
      <div className={`${etatRole === 'BE' ? 'border-slate-800/10 bg-linear-to-r from-slate-900 via-slate-800 to-blue-700 shadow-slate-300/60' : 'border-blue-100 bg-linear-to-r from-blue-600 via-blue-600 to-cyan-500 shadow-blue-200/70'} rounded-2xl border p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] mb-2">
            {headerLabel} #{etude.id}
          </p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center flex-wrap gap-x-2">
            <MapPin className="w-4 h-4 text-white/70 shrink-0" />
            <span>{demande?.adresseProjet?.rue || demande?.adresseProjet?.ville || 'Projet géotechnique'}</span>
            {(demande?.adresseProjet?.ville || demande?.adresseProjet?.codePostal) && (
              <span className="text-white/70 font-normal text-sm">
                {[demande.adresseProjet.ville, demande.adresseProjet.codePostal].filter(Boolean).join(' ')}
              </span>
            )}
          </h1>
          <p className="text-sm text-white/90 mt-1">
            {demande?.type ? TYPE_LABELS[demande.type] ?? demande.type : 'Étude géotechnique'}
          </p>
          {parcelles.length > 0 && (
            <p className="flex items-center flex-wrap gap-x-1.5 text-[11px] text-white/70 mt-0.5">
              <Landmark className="w-2.5 h-2.5 shrink-0" />
              {parcelles.join(' · ')}
            </p>
          )}
        </div>
        <EtudeStatusBadge etat={etat} className="self-start border-white/30 bg-white/95 sm:self-center" />
      </div>

      {/* Bannière action requise (spécifique au rôle) */}
      {actionBanner}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="gc-surface-panel rounded-2xl p-4 md:p-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">

        {/* Colonne gauche : infos */}
        <div className="space-y-4">

          {/* Carte d'infos spécifique au rôle */}
          {infoCard}

          {/* Carte Dates (commune) */}
          <Card>
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Intervention</span>
                <span className="font-semibold text-slate-800">{formatDateLong(etude.dateIntervention) ?? '—'}</span>
              </div>
              {dateRenduPrevueEditor ? (
                <div className="p-2 rounded bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rendu prévu</span>
                  {dateRenduPrevueEditor}
                </div>
              ) : (
                <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rendu prévu</span>
                  <span className="font-semibold text-slate-800">{formatDateLong(etude.dateRenduPrevue) ?? '—'}</span>
                </div>
              )}
              <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rendu effectif</span>
                <span className="font-semibold text-slate-800">{formatDateLong(etude.dateRendu) ?? '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Carte Terrain / Technique (commune) */}
          {(demande?.superficie != null || demande?.nombreLot != null || demande?.delaiMaxSouhaite != null || parcelles.length > 0) && (
            <Card>
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mountain className="w-3 h-3" /> Terrain / Technique
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-xs">

                {demande?.superficie != null && (
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Superficie
                    </span>
                    <span className="font-semibold text-slate-800">{demande.superficie} m²</span>
                  </div>
                )}

                {demande?.nombreLot != null && (
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <LayoutList className="w-3 h-3" /> Nombre de lots
                    </span>
                    <span className="font-semibold text-slate-800">{demande.nombreLot}</span>
                  </div>
                )}

                {demande?.delaiMaxSouhaite != null && (
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Délai souhaité
                    </span>
                    <span className="font-semibold text-slate-800">{demande.delaiMaxSouhaite} sem</span>
                  </div>
                )}

                {parcelles.length > 0 && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1.5">
                      <Landmark className="w-3 h-3" /> Références cadastrales
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {parcelles.map(ref => (
                        <span key={ref} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-semibold text-slate-700">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          )}
          {/* Carte Description (commune) */}
          {demande?.description && (
            <Card>
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-xs text-slate-600 leading-relaxed">{demande.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Carte Documents de l'étude */}
          {documents && (
            <div className="space-y-3">
              {documents.documentsDemandeDevis.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Documents de la demande
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <DocumentList documents={documents.documentsDemandeDevis} showCard={false} />
                  </CardContent>
                </Card>
              )}
              {documents.devisPdf && (
                <Card>
                  <CardHeader className="pb-2 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Devis (proposition)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <DocumentList documents={[documents.devisPdf]} showCard={false} />
                  </CardContent>
                </Card>
              )}
              {documents.devisSigne && (
                <Card>
                  <CardHeader className="pb-2 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Devis signé
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <DocumentList documents={[documents.devisSigne]} showCard={false} />
                  </CardContent>
                </Card>
              )}
              {documents.rapport && (
                <Card>
                  <CardHeader className="pb-2 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Rapport final
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <DocumentList documents={[documents.rapport]} showCard={false} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>

        {/* Colonne droite : stepper */}
        <div className="min-w-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Progression du dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <EtudeStepper
                etat={etat}
                role={etatRole}
                renderActions={renderActions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Spinner de chargement partagé */
export function EtudeDetailLoadingSpinner() {
  return (
    <div className="flex justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

