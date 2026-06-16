import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { getClientByUserId } from '../../api/client';
import { useTypesEtude } from '../../hooks/useTypesEtude';
import { useDemandeSubmission } from '../../hooks/useDemandeSubmission';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CadastralReferencesField } from '../../components/ui/CadastralReferencesField';
import { FileUploader } from '../../components/shared/FileUploader';
import { TypeEtudeSelect } from '../../components/project/TypeEtudeSelect';
import { buildDemandePayload, mapFormFieldsToPayloadBase } from '../../lib/demandePayload';
import { codePostalRules } from '../../lib/validators';
import { getFieldMessage } from '../../lib/formErrors';

export default function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const [errorDetails, setErrorDetails] = useState('');
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
  const [referencesCadastrales, setReferencesCadastrales] = useState<string[]>(['']);

  const { submit, isSubmitting } = useDemandeSubmission({
    onSuccess: () => navigate('/client/dashboard'),
    onError: (msg) => setErrorDetails(msg),
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setErrorDetails('');
    try {
      if (!user) throw new Error("Vous n'êtes pas connecté.");

      const myClient = await getClientByUserId(user.userId);
      if (!myClient?.id) {
        throw new Error('Compte client introuvable pour cet utilisateur.');
      }

      const payload = buildDemandePayload({
        clientId: myClient.id,
        ...mapFormFieldsToPayloadBase(data),
        referencesCadastrales,
        rueProjet: data.rueProjet as string,
        codePostalProjet: data.codePostal as string,
        villeProjet: data.ville as string,
      });

      await submit(payload, docFiles);
    } catch (err: unknown) {
      setErrorDetails(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
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
              <TypeEtudeSelect
                id="type-new-request"
                register={formRegister}
                disabled={false}
                types={typesEtude}
                loading={loadingTypes}
                error={errors.type ? 'Ce champ est requis' : undefined}
              />

              <div>
                <label htmlFor="description-new-request" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description ou particularités du projet
                </label>
                <textarea
                  id="description-new-request"
                  maxLength={2000}
                  {...formRegister('description', { maxLength: { value: 2000, message: 'La description ne doit pas dépasser 2000 caractères' } })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 transition-colors min-h-[100px]"
                  placeholder="Ex : terrain en pente, nappe phréatique connue..."
                />
                {errors.description && (
                  <span className="text-red-500 text-xs mt-1 block">{getFieldMessage(errors.description)}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CadastralReferencesField
                  value={referencesCadastrales}
                  onChange={setReferencesCadastrales}
                />

                <Input
                  label="Superficie (m²)"
                  type="number"
                  placeholder="Ex : 500"
                  min={0}
                  {...formRegister('superficie', { min: { value: 0, message: 'La superficie doit être positive' } })}
                  error={getFieldMessage(errors.superficie)}
                />
                <Input
                  label="Nombre de lots"
                  type="number"
                  placeholder="Ex : 1"
                  min={0}
                  {...formRegister('nombreLot', { min: { value: 0, message: 'Le nombre de lots doit être positif' } })}
                  error={getFieldMessage(errors.nombreLot)}
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
                  error={getFieldMessage(errors.codePostal)}
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

              <FileUploader
                id="docFile-new-request"
                docFiles={docFiles}
                setDocFiles={setDocFiles}
                labelClassName="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2"
              />
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
