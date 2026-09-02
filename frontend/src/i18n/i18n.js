import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      'app.name': 'RE-CIRCLE',
      'nav.dashboard': 'Dashboard',
      'nav.createLot': 'Create Lot',
      'nav.prices': 'Prices',
      'nav.recyclers': 'Recyclers',
      'nav.earnings': 'Earnings',
      'nav.safety': 'Safety',
      'nav.profile': 'Profile',
      'nav.logout': 'Logout',
    }
  },
  hi: {
    translation: {
      'app.name': 'री-सर्कल',
      'nav.dashboard': 'डैशबोर्ड',
      'nav.createLot': 'लॉट बनाएं',
      'nav.prices': 'कीमतें',
      'nav.recyclers': 'रिसाइकलर',
      'nav.earnings': 'कमाई',
      'nav.safety': 'सुरक्षा',
      'nav.profile': 'प्रोफाइल',
      'nav.logout': 'लॉगआउट',
    }
  },
  mr: {
    translation: {
      'app.name': 'री-सर्कल',
      'nav.dashboard': 'डॅशबोर्ड',
      'nav.createLot': 'लॉट तयार करा',
      'nav.prices': 'किंमती',
      'nav.recyclers': 'रिसायकलर',
      'nav.earnings': 'कमाई',
      'nav.safety': 'सुरक्षा',
      'nav.profile': 'प्रोफाइल',
      'nav.logout': 'लॉगआउट',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
