// useTranslation.js - Hook for handling translations

import { useMemo } from "react";
import useStore from "./useStore";
import translations from "../constants/translations";

const useTranslation = () => {
  const { lang = "pol" } = useStore();

  const t = useMemo(() => {
    const currentLang = lang === "eng" ? "eng" : "pol"; // Default to Polish if not English

    return (key, fallback = "", params = {}) => {
      const keys = key.split(".");
      let value = translations[currentLang];

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return fallback || key;
        }
      }

      let result = value || fallback || key;

      // Replace placeholders with actual values
      if (params && typeof result === "string") {
        Object.keys(params).forEach((param) => {
          result = result.replace(`{${param}}`, params[param]);
        });
      }

      return result;
    };
  }, [lang]);

  return { t, lang };
};

export default useTranslation;
