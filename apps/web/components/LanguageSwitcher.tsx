"use client";
import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Globe, Check, Search, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ks", name: "Kashmiri", native: "كأشُر" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mni", name: "Manipuri", native: "ꯃꯤꯇꯩꯂꯣꯟ" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ur", name: "Urdu", native: "اردو" }
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = languages.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.native.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLang = languages.find(l => l.code === locale) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-border/50 text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-muted" />
        <span className="text-sm font-medium hidden sm:inline-block">{selectedLang.native}</span>
        <ChevronDown className="w-3 h-3 text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in-up">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search language..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-muted focus:outline-none focus:border-accent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted">No languages found</div>
            ) : (
              filtered.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setLocale(lang.code); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${locale === lang.code ? 'bg-accent/10 text-accent font-semibold' : 'text-text-main hover:bg-border/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.native}</span>
                    <span className="text-xs text-muted opacity-70">— {lang.name}</span>
                  </div>
                  {locale === lang.code && <Check className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
