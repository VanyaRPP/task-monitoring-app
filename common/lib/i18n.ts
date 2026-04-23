import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enProfitPage from '../../public/locales/en/profitPage.json'
import ukProfitPage from '../../public/locales/uk/profitPage.json'
import enCommon from '../../public/locales/en/common.json'
import ukCommon from '../../public/locales/uk/common.json'
import enBankPage from '../../public/locales/en/bankPage.json'
import ukBankPage from '../../public/locales/uk/bankPage.json'
import enGroupedReceipt from '../../public/locales/en/groupedReceipt.json'
import ukGroupedReceipt from '../../public/locales/uk/groupedReceipt.json'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      bankPage: enBankPage,
      profitPage: enProfitPage,
      groupedReceipt: enGroupedReceipt,
    },
    uk: {
      common: ukCommon,
      bankPage: ukBankPage,
      profitPage: ukProfitPage,
      groupedReceipt: ukGroupedReceipt,
    },
  },
  lng: 'uk',
  fallbackLng: 'uk',
  ns: ['common', 'profitPage', 'bankPage', 'groupedReceipt'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  debug: process.env.NODE_ENV === 'development',
})

export default i18n
