import { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';
import { Button } from '../ui/Button';
import { FAQ_ITEMS, STUDY_CARDS, TRUST_ITEMS } from './landingContent';

type LandingSectionsProps = Readonly<{
  onQuoteRequest: (studyCode?: string) => void;
}>;

export function LandingSections({ onQuoteRequest }: LandingSectionsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedFaq, setSelectedFaq] = useState(0);
  const activeFaq = FAQ_ITEMS[selectedFaq];

  const showStudy = (studyIndex: number) => {
    carouselRef.current?.children[studyIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  return (
    <>
      <section id="accueil" aria-labelledby="landing-title" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#e6bd70]">
        <div className="mx-auto grid min-h-[590px] max-w-7xl pb-20 lg:grid-cols-2">
          <div className="relative flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 lg:pr-20">
            <BrandLogo priority className="mb-8 h-24 w-64 object-cover object-center mix-blend-multiply sm:h-28 sm:w-72" />
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pour les particuliers
            </div>
            <h1 id="landing-title" className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-stone-950 sm:text-5xl">
              Votre étude de sol, <span className="text-[#779649]">simplement.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Décrivez votre projet et recevez les devis proposés par des bureaux d'études géotechniques qualifiés près de chez vous.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button type="button" size="lg" className="gap-2" onClick={() => onQuoteRequest()}>
                Demander mon devis <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#etudes" className="gc-secondary-action">Trouver mon type d'étude</a>
            </div>
          </div>

          <div className="relative flex min-h-[390px] items-center justify-center overflow-visible lg:min-h-full">
            <img
              src="/brand/hero-geotechnical-study-detailed.webp"
              alt="Coupe architecturale d'une maison, de ses fondations et des différentes strates du sol"
              className="h-auto w-[116%] max-w-none object-contain object-center mix-blend-multiply [filter:saturate(.52)_contrast(.96)] lg:w-[118%]"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-16 w-28 bg-gradient-to-r from-[#e6bd70] via-[#e6bd70]/90 to-transparent lg:-left-20 lg:w-36" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-5 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 rounded-lg border border-stone-200/70 bg-white/90 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            {TRUST_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="etudes" aria-labelledby="studies-title" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-16 bg-[#f7f4ed] py-14 sm:py-18">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:min-h-[34rem] lg:grid-cols-[0.36fr_0.64fr] lg:px-8">
          <div className="flex flex-col items-start">
            <h2 id="studies-title" className="text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">Les études que nous proposons</h2>
            <p className="mt-5 max-w-sm leading-7 text-stone-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <Button type="button" size="lg" className="mt-7 gap-2" onClick={() => onQuoteRequest()}>
              Demander mon devis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative min-w-0 lg:h-[34rem]">
            <div ref={carouselRef} className="gc-carousel-scrollbar flex h-full gap-4 overflow-x-auto pb-3" aria-label="Types d'études">
              {STUDY_CARDS.map((study, index) => (
                <article
                  key={study.code}
                  className="relative flex min-h-[25rem] w-[82vw] shrink-0 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-7 shadow-[0_12px_24px_-18px_rgba(74,58,38,0.38)] sm:w-[calc((100%-0.5rem)/1.5)] lg:min-h-0 lg:h-[calc(100%-0.75rem)]"
                >
                  <button
                    type="button"
                    aria-label={`Afficher ${study.title}`}
                    onClick={() => showStudy(index)}
                    className="absolute inset-0 z-0 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-inset"
                  />
                  <div className="pointer-events-none relative z-10">
                    <h3 className="text-xl font-black leading-7 text-stone-950">{study.title}</h3>
                    <p className="mt-5 leading-7 text-stone-600">{study.description}</p>
                  </div>
                  <Button type="button" className="relative z-10 mt-8 self-start gap-2" onClick={() => onQuoteRequest(study.code)}>
                    Demander mon devis <ArrowRight className="h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#f7f4ed]/80 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#f7f4ed]/80 to-transparent" />
          </div>
        </div>
      </section>

      <section id="questions" aria-labelledby="faq-title" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-16 bg-white py-14 sm:py-18">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 lg:px-8">
          <div>
            <h2 id="faq-title" aria-label="Les questions que vous vous posez" className="text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">
              Les questions que vous<br />vous posez
            </h2>
            <div className="mt-8 border-t border-stone-200">
              {FAQ_ITEMS.map((item, index) => {
                const isSelected = selectedFaq === index;
                return (
                  <div key={item.question} className="border-b border-stone-200 py-5">
                    <button
                      type="button"
                      aria-expanded={isSelected}
                      onClick={() => setSelectedFaq(index)}
                      className="flex w-full items-center justify-between gap-4 text-left text-lg font-bold text-stone-900"
                    >
                      {item.question}<span aria-hidden="true">{isSelected ? '−' : '+'}</span>
                    </button>
                    <div
                      aria-hidden={!isSelected}
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isSelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-3 max-w-xl leading-7 text-stone-600">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="button" size="lg" className="mt-7 gap-2" onClick={() => onQuoteRequest()}>
              Demander mon devis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-h-80 overflow-hidden rounded-2xl bg-[#e6bd70] lg:min-h-[34rem]">
            <img
              key={activeFaq.question}
              src="/brand/hero-geotechnical-study-detailed.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover mix-blend-multiply [filter:saturate(.52)_contrast(.96)]"
              style={{ objectPosition: activeFaq.imagePosition }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
