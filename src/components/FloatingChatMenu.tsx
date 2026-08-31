'use client';

import { useState, useRef, useEffect } from 'react';

const WHATSAPP_NUMBER = '2348158431703';
const PREFILL_MESSAGE = encodeURIComponent(
  'Hello, I need help with my account / deposit.',
);
const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${PREFILL_MESSAGE}`;

export default function FloatingChatMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const openTawkChat = () => {
    if (window.Tawk_API?.showWidget) {
      window.Tawk_API.showWidget();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.Tawk_API as any)?.maximize?.();
    }
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-99998 flex flex-col items-end gap-3">
      {/* Menu Options */}
      <div 
        className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* WhatsApp Option */}
        <a 
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group justify-end"
          onClick={() => setIsOpen(false)}
        >
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm font-bold shadow-lg">
            WhatsApp
          </span>
          <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
        </a>

        {/* Tawk.to Option */}
        <button 
          onClick={openTawkChat}
          className="flex items-center gap-3 group justify-end"
        >
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm font-bold shadow-lg">
            Live Chat
          </span>
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Main Toggle Button */}
      <div className="relative flex justify-end">
        {/* Permanent Description Banner */}
        <div 
          className={`absolute bottom-full right-0 mb-3 px-4 py-2 rounded-xl bg-white shadow-xl border border-slate-200 text-slate-900 text-xs font-bold whitespace-nowrap transition-all duration-300 origin-bottom-right ${
            isOpen ? 'opacity-0 scale-95 pointer-events-none blur-sm' : 'opacity-100 scale-100'
          }`}
        >
          An admin is available to chat
        </div>

        {/* Pulsing ring effect (only when menu is closed) */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 z-10"
          aria-label="Chat Support"
        >
          <svg 
            className={`w-6 h-6 absolute transition-all duration-300 ${isOpen ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {/* Close icon (X) */}
          <svg 
            className={`w-6 h-6 absolute transition-all duration-300 ${isOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
