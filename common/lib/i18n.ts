import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enProfitPage from '../../public/locales/en/profitPage.json'
import ukProfitPage from '../../public/locales/uk/profitPage.json'

import enCommon from '../../public/locales/en/common.json'
import ukCommon from '../../public/locales/uk/common.json'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      profitPage: enProfitPage,
      common: enCommon,
    },
    uk: {
      profitPage: ukProfitPage,
      common: ukCommon,
    },
  },
  lng: 'uk',
  fallbackLng: 'uk',
  interpolation: {
    escapeValue: false,
  },
  ns: ['common', 'profitPage'],
  defaultNS: 'common',
})

export default i18n
