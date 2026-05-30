import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { createDemandeDevis } from '../../api/demandeDevis';
import { getClientByUserId } from '../../api/client';
import { uploadDocuments } from '../../api/document';
import { useTypesEtude } from '../../hooks/useTypesEtude';
import { MapPin, Paperclip, Plus, X as XIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CadastralReferencesField } from '../../components/ui/CadastralReferencesField';
import { TypeDemandeDevis } from '../../types';
import { normalizeReferencesCadastrales } from '../../lib/cadastralReferences';
import { codePostalRules } from '../../lib/validators';

export default function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
  const [referencesCadastrales, setReferencesCadastrales] = useState<string[]>(['']);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setErrorDetails('');
    try {
      if (!user) throw new Error("Vous n'êtes pas connecté.");

      const myClient = await getClientByUserId(user.userId);

      if (!myClient?.id) {
        throw new Error("Compte client introuvable pour cet utilisateur.");
      }

      const docsDevisIds = await uploadDocuments(docFiles);

      await createDemandeDevis({
        clientId: myClient.id,
        delaiMaxSouhaite: data.delaiMaxSouhaite ? Number(data.delaiMaxSouhaite) : undefined,
        type: data.type as TypeDemandeDevis,
        description: data.description,
        nombreLot: data.nombreLot ? Number(data.nombreLot) : undefined,
        referencesCadastrales: normalizeReferencesCadastrales(referencesCadastrales),
        superficie: data.superficie ? Number(data.superficie) : undefined,
        docsDevisIds,
        adresseProjet: {
          rue: data.rueProjet,
          codePostal: data.codePostal,
          ville: data.ville,
        },
      });

      navigate('/client/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorDetails(err?.response?.data?.message || err?.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFiles = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setDocFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Nouvelle demande géotechnique</h1>
        <p className="text-slate-500">Décrivez votre projet en quelques étapes simples.</p>
      </div>

      {errorDetails && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {errorDetails}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center text-slate-800">
              <MapPin className="w-5 h-5 mr-2 text-slate-400" />
              Détails du projet
            </CardTitle>
            <CardDescription>Renseignez les informations de votre mission géotechnique.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              {/* Type de mission */}
              <div>
                <label htmlFor="type-new-request" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Type de mission *
                </label>
                <select
                  id="type-new-request"
                  className="w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 transition-colors disabled:opacity-50"
                  disabled={loadingTypes}
                  {...formRegister('type', { required: true })}
                >
                  <option value="">
                    {loadingTypes ? 'Chargement…' : 'Sélectionner…'}
                  </option>
                  {typesEtude.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
                {errors.type && <span className="text-red-500 text-xs mt-1 block">Ce champ est requis</span>}
              </div>

              <Input
                label="Description ou particularités du projet"
                placeholder="Ex : terrain en pente, nappe phréatique connue..."
                {...formRegister('description')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CadastralReferencesField
                  value={referencesCadastrales}
                  onChange={setReferencesCadastrales}
                />

                <Input
                  label="Superficie (m²)"
                  type="number"
                  placeholder="Ex : 500"
                  {...formRegister('superficie')}
                />
                <Input
                  label="Nombre de lots"
                  type="number"
                  placeholder="Ex : 1"
                  {...formRegister('nombreLot')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Rue *"
                  placeholder="Ex : 15 Avenue des Champs-Élysées"
                  {...formRegister('rueProjet', { required: true })}
                  error={errors.rueProjet ? 'Requis' : undefined}
                />
                <Input
                  label="Code Postal *"
                  placeholder="Ex : 75001"
                  {...formRegister('codePostal', codePostalRules)}
                  error={errors.codePostal ? (errors.codePostal as { message?: string }).message : undefined}
                />
                <Input
                  label="Ville *"
                  placeholder="Ex : Paris"
                  {...formRegister('ville', { required: true })}
                  error={errors.ville ? 'Requis' : undefined}
                />
                <Input
                  type="number"
                  label="Délai maximum souhaité (semaines)"
                  placeholder="Ex : 8"
                  min={1}
                  {...formRegister('delaiMaxSouhaite')}
                />
              </div>

               {/* Document joint */}
               <div>
                 <label htmlFor="docFile-new-request" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                   Documents joints (plans, cahier des charges…)
                 </label>
                 {docFiles.length === 0 ? (
                   <div
                     className="flex items-center gap-3 border border-dashed border-slate-300 rounded-md px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                     <span className="text-sm text-slate-500 truncate">
                       Joindre un ou plusieurs fichiers (PDF, image…)
                     </span>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <ul className="space-y-1">
                       {docFiles.map((file, index) => (
                         <li
                           key={`${file.name}-${index}`}
                           className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                         >
                           <span className="flex items-center gap-2 text-xs font-medium text-slate-700 min-w-0">
                             <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                             <span className="truncate" title={file.name}>
                               {file.name}
                             </span>
                           </span>
                           <button
                             type="button"
                             onClick={() => handleRemoveFile(index)}
                             className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                             title="Supprimer ce fichier"
                             aria-label={`Supprimer ${file.name}`}
                           >
                             <XIcon className="w-4 h-4" />
                           </button>
                         </li>
                       ))}
                     </ul>
                     <button
                       type="button"
                       onClick={handleAddFiles}
                       className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                       title="Ajouter d'autres fichiers"
                     >
                       <Plus className="w-4 h-4" />
                       Ajouter d'autres fichiers
                     </button>
                   </div>
                 )}
                  <input
                    id="docFile-new-request"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files ?? []);
                      if (newFiles.length > 0) {
                        setDocFiles(prev => [...prev, ...newFiles]);
                        // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }
                    }}
                  />
               </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-3"
              onClick={() => navigate('/client/dashboard')}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Créer la demande
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
