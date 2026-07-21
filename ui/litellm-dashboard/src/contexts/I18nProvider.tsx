"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18next, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SupportedLanguage,
  getStoredLanguage,
} from "@/i18n/config";

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLanguage must be used within an I18nProvider");
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
}

// Wraps the app with i18next + a small context for the language switcher.
// pt-BR is the default; the choice persists in localStorage across sessions.
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => getStoredLanguage() ?? DEFAULT_LANGUAGE);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    i18next.changeLanguage(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage }}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
};

export default I18nProvider;
