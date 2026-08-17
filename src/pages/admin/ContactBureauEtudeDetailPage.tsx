import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getContactBureauEtude,
  markContacted,
  setContactArchived,
} from '../../api/contactsBureauEtude';
import { Button } from '../../components/ui/Button';
import { ContactBureauEtudeDTO } from '../../types';

export default function ContactBureauEtudeDetailPage() {
  const id = Number(useParams().id);
  const [contact, setContact] = useState<ContactBureauEtudeDTO>();
  const loadContact = useCallback(
    () => getContactBureauEtude(id).then(setContact),
    [id],
  );

  useEffect(() => {
    void loadContact();
  }, [loadContact]);

  if (!contact) {
    return <p>Chargement…</p>;
  }

  const handleContacted = async () => {
    await markContacted(id);
    await loadContact();
  };

  const handleArchived = async () => {
    await setContactArchived(id, !contact.archivedAt);
    await loadContact();
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/admin/contacts-bureaux-etudes">← Retour</Link>
      <section className="rounded-xl bg-white p-6">
        <h1 className="text-2xl font-bold">{contact.raisonSociale}</h1>
        <p>{contact.email} · {contact.telephone}</p>
        <p>{contact.adresse.rue}, {contact.adresse.codePostal} {contact.adresse.ville}</p>
        <div className="my-5 whitespace-pre-wrap rounded bg-slate-50 p-4">{contact.message}</div>
        <div className="flex gap-2">
          {!contact.contactedAt && <Button onClick={handleContacted}>Marquer comme contacté</Button>}
          {!contact.convertedAt && (
            <Link to={`/admin/bureaux-etudes/nouveau?contactId=${id}`}>
              <Button>Initialiser la création du compte</Button>
            </Link>
          )}
          <Button variant="secondary" onClick={handleArchived}>
            {contact.archivedAt ? 'Restaurer' : 'Archiver'}
          </Button>
        </div>
      </section>
    </div>
  );
}
