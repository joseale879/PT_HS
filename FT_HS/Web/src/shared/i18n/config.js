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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt', 'it'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
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
