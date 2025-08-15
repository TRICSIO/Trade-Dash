'use client';

import { useLanguage } from '@/context/language-context';

type TranslationKey = keyof typeof import('@/locales/en.json');

export const useTranslation = () => {
  const { translations } = useLanguage();

  const t = (key: TranslationKey, substitutions?: Record<string, string | number | undefined>): string => {
    let translation = translations[key] || key;
    
    if (substitutions) {
        Object.entries(substitutions).forEach(([subKey, value]) => {
            if (value !== undefined) {
                translation = translation.replace(`{{${subKey}}}`, String(value));
            }
        });
    }

    return translation;
  };

  return { t };
};
