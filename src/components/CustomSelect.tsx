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
  searchable = false,
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
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 bg-white ${
          isOpen
            ? 'border-primary ring-2 ring-primary/10 shadow-sm'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
          error ? 'border-rose-500 ring-1 ring-rose-500/20' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>}
          <div className="truncate">
            <span className={`block truncate text-xs font-bold ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.sublabel && (
              <span className="block truncate text-[11px] text-slate-500 font-normal">{selectedOption.sublabel}</span>
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
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <svg
                  className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
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
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-60 p-1.5 space-y-0.5">
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
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <div className="truncate">
                        <span className="block truncate text-xs">{option.label}</span>
                        {option.sublabel && (
                          <span
                            className={`block truncate text-[10px] ${
                              isSelected ? 'text-primary/70' : 'text-slate-400'
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
                              ? 'bg-primary/20 text-primary'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
