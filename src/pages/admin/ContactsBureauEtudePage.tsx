import { useEffect,useState } from 'react'; import { Link } from 'react-router-dom'; import { Search,Building2 } from 'lucide-react';
import { listContactsBureauEtude } from '../../api/contactsBureauEtude'; import { ContactBureauEtudeDTO } from '../../types'; import { Button } from '../../components/ui/Button';
function getTrackingLabel(contact: ContactBureauEtudeDTO) {
  if (contact.convertedAt) {
    return 'Compte créé';
  }

  if (contact.contactedAt) {
    return 'Contacté';
  }

  return 'À contacter';
}
export default function ContactsBureauEtudePage(){const [items,setItems]=useState<ContactBureauEtudeDTO[]>([]),[search,setSearch]=useState(''),[archived,setArchived]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');useEffect(()=>{const t=setTimeout(()=>{setLoading(true);setError('');listContactsBureauEtude(0,50,search,archived).then(r=>setItems(r.items)).catch(()=>setError('Impossible de charger les contacts.')).finally(()=>setLoading(false));},250);return()=>clearTimeout(t)},[search,archived]);return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Contacts bureaux d'études</h1><p className="text-sm text-slate-500">Messages reçus depuis le formulaire public</p></div><Link to="/admin/bureaux-etudes/nouveau"><Button>Créer un bureau d'études</Button></Link></div><div className="flex gap-3"><label className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3"><Search className="h-4 w-4"/><input className="w-full py-2 outline-none" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Entreprise ou email"/></label><Button variant="secondary" onClick={()=>setArchived(!archived)}>{archived?'Voir les actifs':'Voir les archivés'}</Button></div>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading?<p>Chargement…</p>:<div className="overflow-hidden rounded-xl bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Entreprise</th><th>Contact</th><th>Ville</th><th>Reçu le</th><th>Suivi</th></tr></thead><tbody>{items.map(c=><tr key={c.id} className="border-t"><td className="p-3"><Link className="font-semibold text-blue-700" to={`/admin/contacts-bureaux-etudes/${c.id}`}>{c.raisonSociale}</Link>{!c.readAt&&<span className="ml-2 rounded bg-blue-100 px-2 text-xs">Nouveau</span>}</td><td>{c.email}<br/>{c.telephone}</td><td>{c.adresse.ville}</td><td>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td><td>{getTrackingLabel(c)}</td></tr>)}</tbody></table>{items.length===0&&<p className="p-8 text-center text-slate-500"><Building2 className="mx-auto"/>Aucun contact</p>}</div>}</div>}
