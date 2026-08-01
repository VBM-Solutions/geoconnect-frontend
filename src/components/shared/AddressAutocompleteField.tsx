import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Search } from 'lucide-react';
import { searchAddressSuggestions } from '../../api/addressAutocomplete';
import { AddressSuggestionDTO } from '../../types';
import { cn } from '../../lib/utils';

interface AddressAutocompleteFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelect: (suggestion: AddressSuggestionDTO) => void;
  onInputChange?: () => void;
}

export function AddressAutocompleteField({
  id,
  label,
  placeholder = 'Rechercher une adresse officielle',
  disabled = false,
  className,
  onSelect,
  onInputChange,
}: Readonly<AddressAutocompleteFieldProps>) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabelRef = useRef<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3 || selectedLabelRef.current === normalizedQuery) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const timeoutId = globalThis.setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(normalizedQuery, 8);
        if (!cancelled) {
          setSuggestions(results);
          setIsOpen(true);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSelect = (suggestion: AddressSuggestionDTO) => {
    selectedLabelRef.current = suggestion.label;
    setQuery(suggestion.label);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(suggestion);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            selectedLabelRef.current = null;
            onInputChange?.();
            setQuery(event.target.value);
          }}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex h-10 w-full rounded border border-slate-300 bg-white pl-9 pr-10 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50"
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden="true" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={`${id}-suggestions`}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.label}-${index}`}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">{suggestion.label}</span>
                  {(suggestion.codePostal || suggestion.ville) && (
                    <span className="block truncate text-xs text-slate-500">
                      {[suggestion.codePostal, suggestion.ville].filter(Boolean).join(' ')}
                    </span>
                  )}
                </span>
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
