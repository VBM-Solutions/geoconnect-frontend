import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Forbidden() {
  return (
    <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Acces refuse</h1>
      <p className="mt-2 text-sm text-slate-600">
        Vous etes authentifie, mais vous n avez pas les droits necessaires pour acceder a cette page.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button>Retour a l accueil</Button>
        </Link>
      </div>
    </div>
  );
}

