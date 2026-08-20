import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { DepartementDTO } from '../../types';

interface DepartementMultiSelectProps {
  departements: DepartementDTO[];
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

/**
 * MultiSelect de départements français.
 * - Recherche filtrante intégrée
 * - Badges des sélections affichés sous le déclencheur
 * - Accessible (aria-expanded, aria-label, rôle listbox)
 * - Réutilisable pour tout contexte de sélection multi-département
 */
export function DepartementMultiSelect({
  departements,
  selectedCodes,
  onChange,
  disabled = false,
  id: externalId,
  ariaLabel = 'Sélectionner des départements',
}: Readonly<DepartementMultiSelectProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listboxId = `${externalId ?? generatedId}-listbox`;

  const filtered = departements.filter(
    (d) =>
      d.libelle.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  );

  // Ferme sur clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Ferme sur Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search à l'ouverture
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const toggle = (code: string) => {
    if (disabled) return;
    const next = selectedCodes.includes(code)
      ? selectedCodes.filter((c) => c !== code)
      : [...selectedCodes, code];
    onChange(next);
  };

  const removeCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedCodes.filter((c) => c !== code));
  };

  const selectedDepts = departements.filter((d) => selectedCodes.includes(d.code));
  const selectedCount = selectedCodes.length;
  const pluralSuffix = selectedCount > 1 ? 's' : '';
  const placeholder =
    selectedCount === 0
      ? 'Sélectionner des départements…'
      : `${selectedCount} département${pluralSuffix} sélectionné${pluralSuffix}`;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Déclencheur */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      aria-label={ariaLabel}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer'
        }`}
      >
        <span className={selectedCodes.length === 0 ? 'text-slate-400' : ''}>
          {placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown — role="group" pour compatibilité a11y sans forcer un native <select> */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
          role="group"
          id={listboxId}
          aria-label="Liste des départements"
        >
          {/* Recherche */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un département…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Rechercher un département"
              />
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">Aucun résultat</p>
            )}
            {filtered.map((dept) => {
              const checked = selectedCodes.includes(dept.code);
              return (
                <button
                  key={dept.code}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(dept.code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${
                    checked ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}
                    aria-hidden="true"
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="currentColor">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1">{dept.libelle}</span>
                  <span className="text-xs text-slate-400 font-mono">{dept.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges des sélections */}
      {selectedDepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Départements sélectionnés">
          {selectedDepts.map((dept) => (
            <span
              key={dept.code}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                disabled
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {dept.libelle} ({dept.code})
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeCode(dept.code, e)}
                  className="hover:text-blue-900 transition-colors"
                  aria-label={`Retirer ${dept.libelle}`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}






