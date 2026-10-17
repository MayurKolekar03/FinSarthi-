/**
 * ============================================================================
 *  LanguageContext.tsx — Global Language State Management
 *  Author: FinSarathi AI & Systems Team
 *  Purpose:
 *    Synchronizes active language across the entire application (EN, HI, MR).
 *    Persists choice into AsyncStorage so user preference is remembered.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../utils/i18n';

const LANGUAGE_STORAGE_KEY = '@finsarathi_user_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof typeof TRANSLATIONS['EN']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  setLanguage: () => {},
  t: (key) => {
    const val = TRANSLATIONS.EN[key];
    return (typeof val === 'string' ? val : String(key)) as string;
  },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('EN');

  useEffect(() => {
    // Load persisted language
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      if (saved && (saved === 'EN' || saved === 'HI' || saved === 'MR')) {
        setLanguageState(saved as SupportedLanguage);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch(() => {});
  };

  const t = (key: keyof typeof TRANSLATIONS['EN']): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.EN;
    return (dict as any)[key] || TRANSLATIONS.EN[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
