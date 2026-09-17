import { useState, useEffect, useCallback } from 'react'
import translations from '../translations'

const lookup = (langBlock, keys) => {
  let value = langBlock
  for (const k of keys) {
    if (value && typeof value === 'object' && value[k] !== undefined) {
      value = value[k]
    } else {
      return undefined
    }
  }
  return value
}

export const useTranslation = () => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })

  const t = useCallback(
    (key, params = {}) => {
      const keys = key.split('.')
      const langBlock = translations[language] || translations.en

      let value = lookup(langBlock, keys)

      // English fallback so missing keys never show the raw path
      if (value === undefined || typeof value !== 'string') {
        const fallback = lookup(translations.en, keys)
        if (typeof fallback === 'string') {
          value = fallback
        } else if (typeof value !== 'string') {
          return key
        }
      }

      if (typeof value === 'string') {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
          return params[paramName] !== undefined ? params[paramName] : match
        })
      }

      return value || key
    },
    [language]
  )

  const changeLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguage(lang)
      localStorage.setItem('language', lang)
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('language') || 'en'
      setLanguage(stored)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return { t, language, changeLanguage }
}
