import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR";
import en from "./locales/en";

export const SUPPORTED_LANGUAGES = ["pt-BR", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// pt-BR is the product default. English remains available via the language switcher.
export const DEFAULT_LANGUAGE: SupportedLanguage = "pt-BR";

export const LANGUAGE_STORAGE_KEY = "litellm_ui_language";

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? "")
    ? (stored as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      "pt-BR": { translation: ptBR },
      en: { translation: en },
    },
    lng: getStoredLanguage(),
    fallbackLng: "pt-BR",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18next;
