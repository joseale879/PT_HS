import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';
import it from './locales/it.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt },
  it: { translation: it },
};

// Repair legacy strings saved with UTF-8 decoded as Latin-1.
const repairMojibake = {
  name: 'repair-mojibake',
  type: 'postProcessor',
  process(value) {
    const markers = ['\u00c3', '\u00c2', '\u00e2', '\u00f0'];
    if (typeof value !== 'string' || !markers.some((marker) => value.includes(marker))) {
      return value;
    }
    try {
      return decodeURIComponent(escape(value));
    } catch {
      return value;
    }
  },
};

i18n
  .use(LanguageDetector)
  .use(repairMojibake)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt', 'it'],
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    postProcess: ['repair-mojibake'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'hidrosmart_language',
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (language) => {
  localStorage.setItem('hidrosmart_language', language.split('-')[0]);
});

export default i18n;
