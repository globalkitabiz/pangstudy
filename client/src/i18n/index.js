import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Korean translations
import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koDeck from './locales/ko/deck.json';
import koStudy from './locales/ko/study.json';
import koAdmin from './locales/ko/admin.json';

// English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDeck from './locales/en/deck.json';
import enStudy from './locales/en/study.json';
import enAdmin from './locales/en/admin.json';

// Indonesian translations
import idCommon from './locales/id/common.json';
import idAuth from './locales/id/auth.json';
import idDeck from './locales/id/deck.json';
import idStudy from './locales/id/study.json';
import idAdmin from './locales/id/admin.json';

const resources = {
  ko: {
    common: koCommon,
    auth: koAuth,
    deck: koDeck,
    study: koStudy,
    admin: koAdmin
  },
  en: {
    common: enCommon,
    auth: enAuth,
    deck: enDeck,
    study: enStudy,
    admin: enAdmin
  },
  id: {
    common: idCommon,
    auth: idAuth,
    deck: idDeck,
    study: idStudy,
    admin: idAdmin
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'auth', 'deck', 'study', 'admin'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18n;
