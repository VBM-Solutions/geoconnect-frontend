import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

type StudyFinderPlaceholderProps = Readonly<{
  onContinue: () => void;
}>;

export function StudyFinderPlaceholder({ onContinue }: StudyFinderPlaceholderProps) {
  return (
    <section id="quelle-etude" aria-labelledby="study-finder-title" className="gc-landing-section overflow-hidden bg-[#f4f0e7]">
      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <div>
          <span className="gc-eyebrow"><Compass className="h-4 w-4" /> Assistant d'orientation</span>
          <h2 id="study-finder-title" className="mt-4 text-3xl font-black tracking-tight text-stone-900">
            De quelle étude de sol avez-vous besoin ?
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-stone-600">
            Répondez à quelques questions simples. L'outil vous orientera vers la mission la plus adaptée, que le bureau d'études confirmera ensuite.
          </p>

          <div className="mt-6 space-y-4" aria-label="Aperçu du futur assistant d'orientation">
            <label className="block text-sm font-bold text-stone-800">
              Quel est votre projet ?
              <select disabled className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-500">
                <option>Construction, vente, rénovation…</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-stone-800">
              Où en êtes-vous ?
              <select disabled className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-500">
                <option>Je prépare mon projet…</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white p-6 shadow-lg shadow-stone-900/5">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4df] text-[#688239]">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#688239]">Composant en préparation</p>
            <h3 className="mt-2 text-2xl font-black text-stone-900">Votre recommandation apparaîtra ici</h3>
            <p className="mt-3 leading-7 text-stone-600">
              L'interface est réservée dès maintenant. Le questionnaire et les règles de recommandation seront branchés après validation du référentiel métier.
            </p>
          </div>
          <Button type="button" size="lg" className="mt-8 gap-2 self-start" onClick={onContinue}>
            Décrire mon projet sans attendre <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
