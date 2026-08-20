import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createBureauEtudeAdmin, getContactBureauEtude } from '../../api/contactsBureauEtude';
import { AddressAutocompleteField } from '../../components/shared/AddressAutocompleteField';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { emailRules, phoneRules } from '../../lib/validators';
import { AddressSuggestionDTO, ContactBureauEtudeDTO } from '../../types';

type FormValues = { raisonSociale: string; email: string; telephone: string; rue: string; codePostal: string; ville: string };

const raisonSocialeRules = {
  required: 'Champ obligatoire',
  maxLength: { value: 255, message: '255 caractères maximum' },
  validate: (value: string) => value.trim().length > 0 || 'Champ obligatoire',
} as const;

export default function CreateBureauEtudePage() {
  const [params] = useSearchParams();
  const contactId = params.get('contactId');
  const [contact, setContact] = useState<ContactBureauEtudeDTO>();
  const [address, setAddress] = useState<AddressSuggestionDTO | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (!contactId) return;
    getContactBureauEtude(Number(contactId)).then((loadedContact) => {
      setContact(loadedContact);
      reset({ raisonSociale: loadedContact.raisonSociale, email: loadedContact.email, telephone: loadedContact.telephone,
        rue: loadedContact.adresse.rue, codePostal: loadedContact.adresse.codePostal, ville: loadedContact.adresse.ville });
      setAddress({ label: `${loadedContact.adresse.rue}, ${loadedContact.adresse.ville}`, rue: loadedContact.adresse.rue,
        codePostal: loadedContact.adresse.codePostal, ville: loadedContact.adresse.ville, latitude: loadedContact.adresse.latitude,
        longitude: loadedContact.adresse.longitude, score: loadedContact.adresse.geocodingScore });
    }).catch(() => setError('Impossible de charger le contact.'));
  }, [contactId, reset]);

  const submit = async (values: FormValues) => {
    if (!address) {
      setError('Sélectionnez une adresse via les propositions.');
      return;
    }
    setError('');
    try {
      const result = await createBureauEtudeAdmin({
        raisonSociale: values.raisonSociale.trim(), email: values.email.trim(), telephone: values.telephone.trim(),
        adresse: { rue: values.rue, codePostal: values.codePostal, ville: values.ville, latitude: address.latitude,
          longitude: address.longitude, geocodingScore: address.score },
        contactId: contact?.id, contactVersion: contact?.version,
      });
      navigate(`/admin/utilisateurs/${result.userId}`);
    } catch {
      setError('Impossible de créer le compte. Vérifiez que cet email ou ce contact ne sont pas déjà utilisés.');
    }
  };

  return (
    <form className="mx-auto max-w-2xl space-y-4 rounded-xl bg-white p-6" onSubmit={handleSubmit(submit)} noValidate>
      <h1 className="text-xl font-bold">{contact ? 'Créer le compte depuis le contact' : 'Nouveau bureau d’études'}</h1>
      <p className="text-sm text-slate-500">Le bureau recevra un lien valable 72 heures pour choisir son mot de passe.</p>
      {error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}
      <Input label="Raison sociale" {...register('raisonSociale', raisonSocialeRules)} error={errors.raisonSociale?.message} />
      <Input label="Email" type="email" {...register('email', emailRules)} error={errors.email?.message} />
      <Input label="Téléphone" {...register('telephone', phoneRules)} error={errors.telephone?.message} />
      <AddressAutocompleteField id="admin-be-address" label="Adresse" onInputChange={() => setAddress(null)} onSelect={(suggestion) => {
        setAddress(suggestion); setError(''); setValue('rue', suggestion.rue ?? suggestion.label);
        setValue('codePostal', suggestion.codePostal ?? ''); setValue('ville', suggestion.ville ?? '');
      }} />
      <input type="hidden" {...register('rue', { required: true })} />
      <input type="hidden" {...register('codePostal', { required: true })} />
      <input type="hidden" {...register('ville', { required: true })} />
      <Button type="submit" isLoading={isSubmitting}>Créer et envoyer l’invitation</Button>
    </form>
  );
}
