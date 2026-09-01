"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleLanguageChange = (newLocale: "fr" | "en") => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50" ref={dropdownRef}>
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-36 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-bottom-2">
          <button 
            onClick={() => handleLanguageChange("fr")}
            className={`w-full px-4 py-2 text-sm text-left hover:bg-primary/10 transition-colors ${locale === "fr" ? "text-primary font-medium" : "text-text-muted"}`}
          >
            Français (FR)
          </button>
          <button 
            onClick={() => handleLanguageChange("en")}
            className={`w-full px-4 py-2 text-sm text-left hover:bg-primary/10 transition-colors ${locale === "en" ? "text-primary font-medium" : "text-text-muted"}`}
          >
            English (EN)
          </button>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-surface hover:bg-surface-hover border border-primary/30 rounded-full shadow-lg flex items-center justify-center text-primary transition-all hover:scale-105 active:scale-95"
      >
        <Globe className="w-6 h-6" />
      </button>
    </div>
  );
}
