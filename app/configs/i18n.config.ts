import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '~/locales/en.json'
import ko from '~/locales/ko.json'
import vi from '~/locales/vi.json'

export const LANGUAGES = ['vi', 'en', 'ko'] as const
const LANGUAGE_KEY = 'language'

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    return saved && (LANGUAGES as readonly string[]).includes(saved) ? saved : 'ko'
  } catch {
    return 'ko'
  }
}

i18next.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en }, ko: { translation: ko } },
  lng: getInitialLanguage(),
  fallbackLng: 'vi',
  interpolation: { escapeValue: false }
})

i18next.on('languageChanged', (lng) => {
  // React Router also renders the root on the server (SPA prerender / dev HTML): no DOM there
  if (typeof document === 'undefined') return
  document.documentElement.lang = lng
  try {
    localStorage.setItem(LANGUAGE_KEY, lng)
  } catch {
    // storage unavailable: language just isn't remembered
  }
})

// init() does not emit languageChanged for the starting language: sync <html lang> (root.tsx renders the default)
if (typeof document !== 'undefined') document.documentElement.lang = i18next.language

export default i18next
