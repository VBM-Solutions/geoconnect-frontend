import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Success() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-green-100 p-4 mb-6">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Votre demande de devis a bien été soumise
      </h1>
      <p className="text-lg text-slate-600 max-w-md mb-8">
          Les bureaux d'étude du réseau mon etude de sol ont été notifiés, ils reviendront vers vous d’ici quelques jours.
      </p>
      <Link to="/client/dashboard">
        <Button size="lg">Suivre ma demande</Button>
      </Link>
    </div>
  );
}
