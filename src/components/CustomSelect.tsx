'use client';

import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  searchable = true,
  disabled = false,
  className = '',
  error,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-surface-dark/90 shadow-lg'
            : 'border-border-dark bg-surface-dark/60 hover:border-slate-600 hover:bg-surface-dark'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
          error ? 'border-red-500 ring-1 ring-red-500/20' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <div className="truncate">
            <span className={`block truncate text-sm font-medium ${selectedOption ? 'text-text-primary' : 'text-text-secondary'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.sublabel && (
              <span className="block truncate text-xs text-text-secondary">{selectedOption.sublabel}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedOption?.badge && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {selectedOption.badge}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 max-h-72 bg-surface-dark/95 backdrop-blur-xl border border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2.5 border-b border-border-dark">
              <div className="relative">
                <svg
                  className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-surface-darker/60 border border-border-dark text-white placeholder-text-secondary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-60 p-1.5 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white font-semibold shadow-md'
                        : 'text-text-primary-dark hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <div className="truncate">
                        <span className="block truncate text-sm">{option.label}</span>
                        {option.sublabel && (
                          <span
                            className={`block truncate text-xs ${
                              isSelected ? 'text-blue-100' : 'text-text-secondary'
                            }`}
                          >
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {option.badge && (
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-text-secondary">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
