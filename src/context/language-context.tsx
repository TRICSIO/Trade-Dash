'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Language = 'en' | 'es';

type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
}

const translationsMap = { en, es };

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && ['en', 'es'].includes(storedLang)) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const value = {
    language,
    setLanguage,
    translations: translationsMap[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
