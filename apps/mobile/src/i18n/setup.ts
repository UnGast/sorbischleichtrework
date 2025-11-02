import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const DEFAULT_LANGUAGE = 'de';

const resources = {
  de: {
    translation: {},
  },
  sb: {
    translation: {},
  },
};

if (!i18n.isInitialized) {
  const deviceLocales = Localization.getLocales();
  const languageTag = deviceLocales?.[0]?.languageCode ?? DEFAULT_LANGUAGE;

  void i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      lng: languageTag,
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: 'translation',
      resources,
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
      initImmediate: false,
    })
    .catch((error) => {
      console.warn('Failed to initialize i18n', error);
    });
}

export default i18n;

