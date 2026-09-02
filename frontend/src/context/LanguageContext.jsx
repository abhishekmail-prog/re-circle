import React, { createContext, useState, useContext } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en')

  const changeLanguage = (lang) => {
    if (['en', 'hi', 'mr'].includes(lang)) {
      setLanguage(lang)
      localStorage.setItem('language', lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
