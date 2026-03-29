import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, lat: number, lon: number) => void;
  resolved: boolean;
  onClearResolve: () => void;
  error?: string;
}

export default function AddressAutocomplete({
  label = 'Search Address',
  placeholder = 'Start typing an address...',
  value,
  onChange,
  onSelect,
  resolved,
  onClearResolve,
  error,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length > 2 && !resolved && isOpen) {
      setIsLoading(true);
      axios
        .get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            debouncedQuery
          )}&format=json&limit=5`
        )
        .then((res) => {
          setResults(res.data);
          setIsLoading(false);
        })
        .catch(() => {
          setResults([]);
          setIsLoading(false);
        });
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [debouncedQuery, resolved, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
            if (resolved) onClearResolve();
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full rounded-lg bg-gray-800 border ${
            error ? 'border-red-500' : 'border-gray-700'
          } px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 pr-10`}
          autoComplete="off"
        />
        {resolved && (
          <div className="absolute right-3 text-indigo-400 pointer-events-none" title="Address resolved">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
        {isLoading && !resolved && (
          <div className="absolute right-3 pointer-events-none">
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && results.length > 0 && !resolved && (
        <ul className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 border-b border-gray-700/50 last:border-0"
              onClick={() => {
                setQuery(r.display_name);
                setIsOpen(false);
                onChange(r.display_name);
                onSelect(r.display_name, parseFloat(r.lat), parseFloat(r.lon));
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
      {isOpen && !isLoading && debouncedQuery.length > 2 && results.length === 0 && !resolved && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 text-sm text-gray-400 text-center">
          No results found for "{debouncedQuery}"
        </div>
      )}
    </div>
  );
}
