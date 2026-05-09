// ============================================
// Language context and hook
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, detectLanguage, t as translate } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof import('../lib/i18n').translations.fr) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: () => '',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    // Detect browser language on mount
    const detected = detectLanguage();
    const stored = localStorage.getItem('language') as Language;

    if (stored && ['fr', 'en'].includes(stored)) {
      setLanguageState(stored);
    } else {
      setLanguageState(detected);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof import('../lib/i18n').translations.fr) => {
    return translate(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}