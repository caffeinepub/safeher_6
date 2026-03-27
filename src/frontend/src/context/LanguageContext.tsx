import { type ReactNode, createContext, useContext, useState } from "react";
import { type TranslationKey, translations } from "../i18n/translations";

type Lang = "en" | "hi";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("safeher_lang") as Lang) || "en";
  });

  const setLang = (l: Lang) => {
    localStorage.setItem("safeher_lang", l);
    setLangState(l);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
