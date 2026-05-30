import React, { useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { registerCall } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CadastralReferencesField } from '../components/ui/CadastralReferencesField';
import { PasswordRequirementsHint } from '../components/ui/PasswordRequirementsHint';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { createClient, getClientByUserId } from '../api/client';
import { createDemandeDevis } from '../api/demandeDevis';
import { uploadDocuments } from '../api/document';
import { useTypesEtude } from '../hooks/useTypesEtude';
import { MapPin, Briefcase, Mail, Paperclip, Plus, X as XIcon } from 'lucide-react';
import { TypeDemandeDevis } from '../types';
import { normalizeReferencesCadastrales } from '../lib/cadastralReferences';
import { codePostalRules, createConfirmPasswordRules, passwordRules, phoneRules } from '../lib/validators';

export default function Home() {
  const [step, setStep] = useState(0);
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;
    if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/dashboard" replace />;
  }

  if (step === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-12 max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-4xl italic mb-2">
          G
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
          CONNECTEZ-VOUS AUX EXPERTS GEOTECHNIQUES
        </h1>
        <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
          Un portail simple et sécurisé pour débloquer l'accès à un réseau qualifié de bureaux d'études.
        </p>
        <Button size="lg" onClick={() => setStep(1)} className="mt-4">
          DÉMARRER LE TUNNEL
        </Button>
      </div>
    );
  }

  return <QuoteTunnel />;
}

function QuoteTunnel() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [referencesCadastrales, setReferencesCadastrales] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
   const navigate = useNavigate();
   const { login } = useAuth();

   const handleAddFiles = () => {
     fileInputRef.current?.click();
   };

   const handleRemoveFile = (index: number) => {
     setDocFiles(prev => prev.filter((_, i) => i !== index));
   };


  const { register: formRegister, handleSubmit, getValues, watch, formState: { errors } } = useForm();
  const passwordValue = watch('password', '');

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data });
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitTunnel({ ...formData, ...data });
    }
  };

  const submitTunnel = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Register User
      const authRes = await registerCall({
        login: data.login,
        password: data.password,
        role: 'CLIENT',
      });

      login(authRes);

      // 2. Create Client Profile
      let client = await createClient({
        civilite: data.civilite,
        nom: data.nom,
        prenom: data.prenom,
        emailContact: data.login,
        telContact: data.telContact,
        utilisateurId: authRes.userId,
        adresseFacturation: {
          rue: data.rue,
          ville: data.ville,
          codePostal: data.codePostal,
        },
      });

      let clientId = client?.id;

      if (!clientId) {
        const myClient = await getClientByUserId(authRes.userId);
        if (myClient?.id) {
          clientId = myClient.id;
        } else {
          throw new Error('Client créé mais introuvable sur le serveur.');
        }
      }

      const docsDevisIds = await uploadDocuments(docFiles);

      await createDemandeDevis({
        clientId,
        delaiMaxSouhaite: data.delaiMaxSouhaite ? Number(data.delaiMaxSouhaite) : undefined,
        type: data.type as TypeDemandeDevis,
        description: data.description,
        nombreLot: data.nombreLot ? Number(data.nombreLot) : undefined,
        referencesCadastrales: normalizeReferencesCadastrales(referencesCadastrales),
        superficie: data.superficie ? Number(data.superficie) : undefined,
        docsDevisIds,
        adresseProjet: {
          rue: data.rueProjet,
          codePostal: data.codePostalProjet || data.codePostal,
          ville: data.villeProjet || data.ville,
        },
      });

      navigate('/success');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-16 sm:w-32 mx-2 rounded ${
                    s < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {step === 1 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" /> Quel est votre besoin ?
              </CardTitle>
              <CardDescription>Qualifions rapidement votre projet géotechnique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type de mission */}
              <div className="space-y-1">
                <label htmlFor="type-step1" className="block text-sm font-medium text-slate-700">Type de mission *</label>
                <select
                  id="type-step1"
                  {...formRegister('type', { required: true })}
                  disabled={loadingTypes}
                  className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">{loadingTypes ? 'Chargement…' : 'Sélectionnez un type'}</option>
                  {typesEtude.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
                {errors.type && <span className="text-red-500 text-xs">Requis</span>}
              </div>

              {/* Adresse du projet */}
              <Input
                label="Rue du projet *"
                placeholder="Ex : 15 Avenue des Champs-Élysées"
                {...formRegister('rueProjet', { required: true })}
                error={errors.rueProjet ? 'Requis' : undefined}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  placeholder="Ex : 75001"
                  {...formRegister('codePostalProjet', codePostalRules)}
                  error={errors.codePostalProjet ? (errors.codePostalProjet as { message?: string }).message : undefined}
                />
                <Input
                  label="Ville *"
                  {...formRegister('villeProjet', { required: true })}
                  error={errors.villeProjet ? 'Requis' : undefined}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Suivant
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Détails du projet
              </CardTitle>
              <CardDescription>Donnez plus de contexte à votre demande.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="description-step2" className="block text-sm font-medium text-slate-700">Description du projet *</label>
                <textarea
                  id="description-step2"
                  {...formRegister('description', { required: true })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Décrivez votre besoin, contraintes particulières..."
                />
                {errors.description && <span className="text-red-500 text-xs">Requis</span>}
              </div>
              <CadastralReferencesField
                value={referencesCadastrales}
                onChange={setReferencesCadastrales}
              />
              <div className="grid grid-cols-2 gap-4">
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
              <Input
                type="number"
                label="Délai maximum souhaité (semaines, facultatif)"
                placeholder="Ex : 8"
                min={1}
                {...formRegister('delaiMaxSouhaite')}
              />

               {/* Document joint */}
               <div className="space-y-1">
                 <label htmlFor="docFile-step2" className="block text-sm font-medium text-slate-700">
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
                   id="docFile-step2"
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit">Suivant</Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" /> Vos coordonnées
              </CardTitle>
              <CardDescription>Créez votre compte pour recevoir vos devis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
              )}
              {/* Civilité */}
              <div className="space-y-1">
                <label htmlFor="civilite" className="block text-sm font-medium text-slate-700">Civilité *</label>
                <select
                  id="civilite"
                  {...formRegister('civilite', { required: true })}
                  className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  <option value="MR">M.</option>
                  <option value="MME">Mme</option>
                  <option value="AUTRE">Autre</option>
                </select>
                {errors.civilite && <span className="text-red-500 text-xs">Requis</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  {...formRegister('prenom', { required: true })}
                  error={errors.prenom ? 'Requis' : undefined}
                />
                <Input
                  label="Nom *"
                  {...formRegister('nom', { required: true })}
                  error={errors.nom ? 'Requis' : undefined}
                />
              </div>
              <Input
                label="Téléphone *"
                type="tel"
                placeholder="06 00 00 00 00"
                {...formRegister('telContact', phoneRules)}
                error={errors.telContact ? (errors.telContact.message as string ?? 'Requis') : undefined}
              />
              <Input
                label="Rue (adresse de facturation) *"
                placeholder="12 rue de la République"
                {...formRegister('rue', { required: true })}
                error={errors.rue ? 'Requis' : undefined}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  {...formRegister('codePostal', codePostalRules)}
                  error={errors.codePostal ? (errors.codePostal as { message?: string }).message : undefined}
                />
                <Input
                  label="Ville *"
                  {...formRegister('ville', { required: true })}
                  error={errors.ville ? 'Requis' : undefined}
                />
              </div>
              <Input
                type="email"
                label="Email (identifiant de connexion) *"
                placeholder="votre@email.com"
                {...formRegister('login', { required: true })}
                error={errors.login ? 'Requis' : undefined}
              />
              <div>
                <Input
                  type="password"
                  label="Mot de passe *"
                  {...formRegister('password', passwordRules)}
                  error={errors.password ? (errors.password.message as string) : undefined}
                  showPasswordToggle
                />
                <PasswordRequirementsHint password={passwordValue} />
              </div>
              <Input
                type="password"
                label="Confirmation du mot de passe *"
                {...formRegister('confirmPassword', createConfirmPasswordRules(() => getValues('password')))}
                error={errors.confirmPassword ? (errors.confirmPassword.message as string) : undefined}
                showPasswordToggle
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Publier ma demande
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
