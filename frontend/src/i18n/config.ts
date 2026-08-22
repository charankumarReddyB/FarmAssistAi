/**
 * Internationalization (i18n) Configuration Module for FarmAssist AI
 * Supports English (en), Telugu (te), Tamil (ta), and Hindi (hi).
 */

import { translate, type Lang, LANG_LABELS } from '../translations'

export type { Lang }
export { LANG_LABELS }

export const SUPPORTED_LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', flag: '🇬🇧', locale: 'en-IN' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', flag: '🇮🇳', locale: 'te-IN' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', flag: '🇮🇳', locale: 'ta-IN' },
  { code: 'hi', native: 'హిन्दी', english: 'Hindi', flag: '🇮🇳', locale: 'hi-IN' },
] as const

export function getInitialLanguage(): Lang {
  const saved = localStorage.getItem('farmassist_language') as Lang
  if (saved && ['en', 'te', 'ta', 'hi'].includes(saved)) {
    return saved
  }
  return 'en'
}

export function saveUserLanguage(lang: Lang) {
  localStorage.setItem('farmassist_language', lang)
  document.documentElement.lang = lang

  const userJson = localStorage.getItem('farmassist_user')
  const userObj = userJson ? JSON.parse(userJson) : { name: 'Raju Reddy', location: 'Kakinada, AP' }
  userObj.preferred_language = lang
  localStorage.setItem('farmassist_user', JSON.stringify(userObj))
}

export function t(key: string, lang: Lang = 'en'): string {
  return translate(lang, key)
}
