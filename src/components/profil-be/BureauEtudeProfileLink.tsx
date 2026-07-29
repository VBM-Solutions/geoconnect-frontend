import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BureauEtudeProfileLinkProps {
  readonly raisonSociale?: string;
  readonly slug?: string;
  readonly returnTo: string;
  readonly className?: string;
}

export function BureauEtudeProfileLink({
  raisonSociale,
  slug,
  returnTo,
  className,
}: Readonly<BureauEtudeProfileLinkProps>) {
  const nom = raisonSociale || 'Bureau d’études';

  if (!slug) {
    return <span className={cn('font-semibold text-slate-700', className)}>{nom}</span>;
  }

  return (
    <a
      href={`/bureaux-etudes/${slug}?retour=${encodeURIComponent(returnTo)}`}
      aria-label={`Consulter la fiche de ${nom}`}
      className={cn(
        'group -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-semibold text-slate-800',
        'transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      <span>{nom}</span>
      <ChevronRight
        aria-hidden="true"
        className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600"
      />
    </a>
  );
}
