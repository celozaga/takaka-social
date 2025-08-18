import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importa os arquivos de tradução diretamente para garantir que sejam empacotados com o app.
// Esta é uma abordagem mais robusta do que buscá-los via HTTP.
import translationEN from '../locales/en/translation.json';
import translationES from '../locales/es/translation.json';
import translationPT from '../locales/pt/translation.json';

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
];

// Estrutura as traduções importadas no formato que o i18next espera.
const resources = {
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  pt: {
    translation: translationPT,
  },
};

i18n
  // Não usa mais o backend HttpApi
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources, // Fornece as traduções diretamente
    supportedLngs: supportedLanguages.map(l => l.code),
    fallbackLng: 'en',
    debug: false, // Pode ser definido como true para desenvolvimento
    
    interpolation: {
      escapeValue: false, // O React já protege contra XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'takaka-lang',
    },
    // Como os recursos são empacotados, não precisamos de Suspense para carregá-los.
    // O Suspense principal do app ainda lida com componentes carregados de forma assíncrona (lazy-loaded).
    react: {
      useSuspense: false,
    }
  });

export default i18n;
