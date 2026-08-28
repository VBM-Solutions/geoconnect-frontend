import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmEmailCall } from '../api/auth';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    history.replaceState(null, '', window.location.pathname);
    if (!token) {
      setStatus('error');
      return;
    }
    confirmEmailCall(token).then(() => {
      sessionStorage.removeItem('geoconnect.verification-email');
      setStatus('success');
    }).catch(() => setStatus('error'));
  }, []);

  return (
    <div className="mx-auto max-w-lg py-24 px-4 text-center">
      {status === 'loading' && <p>Validation de votre adresse email…</p>}
      {status === 'success' && <>
        <div className="mb-6 rounded-full bg-green-100 p-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Votre demande de devis a bien été soumise</h1>
        <p className="mb-8 text-lg text-slate-600">
          Les bureaux d'étude du réseau mon etude de sol ont été notifiés, ils reviendront vers vous d’ici quelques jours.
        </p>
        <Button size="lg" onClick={() => navigate('/login')}>Suivre ma demande</Button>
      </>}
      {status === 'error' && <>
        <h1 className="mb-4 text-2xl font-bold">Lien invalide ou expiré</h1>
        <p className="mb-6 text-slate-600">Ce lien de validation est invalide, a expiré ou a déjà été utilisé.</p>
        <Button onClick={() => navigate('/login')}>Se connecter</Button>
      </>}
    </div>
  );
}
