import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { resendVerificationEmailCall } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function EmailVerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string } | null)?.email
    ?? sessionStorage.getItem('geoconnect.verification-email')
    ?? undefined;
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendDelay, setResendDelay] = useState(60);

  useEffect(() => {
    if (resendDelay <= 0) return;
    const timer = window.setTimeout(() => setResendDelay(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendDelay]);

  const resend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await resendVerificationEmailCall(email);
      setResendDelay(60);
      setMessage('Si votre compte attend une validation, un nouvel email a été envoyé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-20 px-4">
      <Card className="text-center">
        <CardHeader>
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          <CardTitle>Vérifiez votre boîte mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>Un lien de validation valable 24 heures a été envoyé{email ? ` à ${email}` : ''}.</p>
          <p>Votre demande est conservée. Elle sera envoyée automatiquement lors de votre première connexion après validation.</p>
          {message && <p className="rounded bg-blue-50 p-3 text-blue-800">{message}</p>}
          <Button onClick={resend} isLoading={loading} disabled={!email || resendDelay > 0}>
            {resendDelay > 0 ? `Renvoyer l'email dans ${resendDelay} s` : "Renvoyer l'email"}
          </Button>
          <Button variant="outline" onClick={() => navigate('/login')}>Aller à la connexion</Button>
        </CardContent>
      </Card>
    </div>
  );
}
