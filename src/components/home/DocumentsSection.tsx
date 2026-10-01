import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { DOCUMENT_GUIDES } from './documentContent';

function instructionTitle(category: string): string {
  if (category === 'PHOTO_ACCES') return 'Quelles photos préparer ?';
  if (category === 'PLAN_SITUATION') return 'Vous possédez déjà ce document ?';
  return 'Comment récupérer ce document ?';
}

export function DocumentsSection() {
  const carouselRef = useRef<HTMLElement>(null);

  const move = (direction: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const card = carousel.firstElementChild as HTMLElement | null;
    carousel.scrollBy({
      left: direction * ((card?.getBoundingClientRect().width ?? carousel.clientWidth) + 16),
      behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  const showDocument = (index: number) => {
    carouselRef.current?.children[index]?.scrollIntoView({
      behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  return (
    <section id="documents" aria-labelledby="documents-title" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-16 bg-[#f7f4ed] py-14 sm:py-18">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.36fr_0.64fr] lg:px-8">
        <div>
          <h2 id="documents-title" className="text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">De quels documents avez-vous besoin ?</h2>
          <p className="mt-5 max-w-sm leading-7 text-stone-600">Mon étude de sol.fr vous accompagne pour récupérer les différents documents dont vous avez besoin.</p>
          <p className="mt-4 max-w-sm leading-7 text-stone-600">Sélectionnez un document et découvrez comment le préparer pour démarrer votre étude.</p>
        </div>
        <div className="relative min-w-0">
          <div className="mb-4 flex justify-end gap-2">
            <button
              type="button"
              aria-label="Documents précédents"
              onClick={() => move(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Documents suivants"
              onClick={() => move(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        <section ref={carouselRef} id="documents-carousel" aria-label="Documents à préparer" className="gc-carousel-scrollbar flex w-full min-w-0 items-stretch gap-4 overflow-x-auto pb-4">
          {DOCUMENT_GUIDES.map((document, index) => (
            <article key={document.category} className="relative flex min-h-[25rem] w-[82vw] min-w-0 max-w-full shrink-0 flex-col whitespace-normal [overflow-wrap:anywhere] rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_12px_24px_-18px_rgba(74,58,38,0.38)] sm:w-[calc((100%_-_0.5rem)/1.5)] sm:p-7">
              <button type="button" aria-label={`Afficher ${document.title}`} onClick={() => showDocument(index)} className="absolute inset-0 z-0 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40" />
              <h3 className="pointer-events-none relative z-10 text-xl font-black leading-7 text-stone-950">{document.title}</h3>
              <p className="pointer-events-none relative z-10 mt-5 leading-7 text-stone-600">{document.description}</p>
              {document.instructions && (
                <div className="pointer-events-none relative z-10 mt-auto pt-6">
                  <h4 className="font-bold text-stone-900">{instructionTitle(document.category)}</h4>
                  {document.instructions.length === 1 ? <p className="mt-3 leading-7 text-stone-600">{document.instructions[0]}</p> : (
                    <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-stone-600">{document.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul>
                  )}
                  {document.link && <a href={document.link.href} target="_blank" rel="noopener noreferrer" className="pointer-events-auto mt-6 inline-flex max-w-full items-center gap-2 text-sm font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">{document.link.label}<ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="sr-only"> (nouvel onglet)</span></a>}
                </div>
              )}
            </article>
          ))}
        </section>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#f7f4ed]/80 to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#f7f4ed]/80 to-transparent" />
        </div>
      </div>
    </section>
  );
}
