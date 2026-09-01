import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import type { KcContext } from "../KcContext";

export function LanguageSwitcher({ kcContext }: { kcContext: KcContext }) {
  const { locale } = kcContext;
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

  if (!locale || locale.supported.length <= 1) {
    return null;
  }

  return (
    <div className="lang-switcher-wrapper" ref={dropdownRef}>
      {isOpen && (
        <div className="lang-dropdown">
          {locale.supported.map((l) => (
            <a
              key={l.languageTag}
              href={l.url}
              className={`lang-btn ${locale.currentLanguageTag === l.languageTag ? "active" : ""}`}
              style={{ display: 'block', textDecoration: 'none' }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lang-toggle"
        type="button"
      >
        <Globe style={{ width: '1.5rem', height: '1.5rem' }} />
      </button>
    </div>
  );
}
