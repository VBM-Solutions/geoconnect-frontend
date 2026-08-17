import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, CheckCircle2 } from 'lucide-react';
import { submitContactBureauEtude } from '../../api/contactsBureauEtude';
import { AddressAutocompleteField } from '../../components/shared/AddressAutocompleteField';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AddressSuggestionDTO } from '../../types';
import { emailRules, phoneRules } from '../../lib/validators';

type Form={raisonSociale:string;email:string;telephone:string;rue:string;codePostal:string;ville:string;message:string};
export default function BERegister(){
 const {register,handleSubmit,setValue,formState:{errors,isSubmitting}}=useForm<Form>();
 const [address,setAddress]=useState<AddressSuggestionDTO|null>(null); const [serverError,setServerError]=useState(''); const [sent,setSent]=useState(false);
 const submit=async(v:Form)=>{if(!address){setServerError('Veuillez sélectionner une adresse parmi les propositions.');return;} setServerError('');try{await submitContactBureauEtude({raisonSociale:v.raisonSociale,email:v.email,telephone:v.telephone,message:v.message,adresse:{rue:v.rue,codePostal:v.codePostal,ville:v.ville,latitude:address.latitude,longitude:address.longitude,geocodingScore:address.score}});setSent(true);}catch{setServerError("La soumission n'a pas pu être envoyée. Réessayez plus tard.");}};
 if(sent)return <div className="mx-auto max-w-lg py-20"><Card><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600"/><h1 className="text-xl font-bold">Merci pour votre message</h1><p className="mt-2 text-slate-600">Notre équipe vous recontactera afin d'échanger sur la création de votre compte.</p></CardContent></Card></div>;
 return <div className="mx-auto max-w-2xl py-12"><Card><CardHeader><CardTitle className="flex gap-2"><Building2/>Rejoindre le réseau professionnel</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit(submit)} className="space-y-4">
  {serverError&&<p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
  <Input label="Raison sociale *" {...register('raisonSociale',{required:'Champ obligatoire'})} error={errors.raisonSociale?.message}/>
  <div className="grid gap-4 sm:grid-cols-2"><Input label="Email professionnel *" type="email" {...register('email',emailRules)} error={errors.email?.message}/><Input label="Téléphone *" {...register('telephone',phoneRules)} error={errors.telephone?.message}/></div>
  <AddressAutocompleteField id="contact-be-address" label="Adresse de l'entreprise *" onInputChange={()=>setAddress(null)} onSelect={s=>{setAddress(s);setValue('rue',s.rue??s.label);setValue('codePostal',s.codePostal??'');setValue('ville',s.ville??'');}}/>
  <input type="hidden" {...register('rue')}/><input type="hidden" {...register('codePostal')}/><input type="hidden" {...register('ville')}/>
  <label className="block text-sm font-medium">Votre message *<textarea className="mt-1 min-h-36 w-full rounded-lg border border-slate-300 p-3" {...register('message',{required:'Champ obligatoire',maxLength:{value:5000,message:'5000 caractères maximum'}})}/></label>{errors.message&&<p className="text-sm text-red-600">{errors.message.message}</p>}
  <Button type="submit" isLoading={isSubmitting} className="w-full">Envoyer mon message</Button>
 </form></CardContent></Card></div>;
}
