import 'react-i18next'
import common from '../../public/locales/uk/common.json'
import profitPage from '../../public/locales/uk/profitPage.json'

interface Resources {
  common: typeof common
  profitPage: typeof profitPage
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: Resources
  }
}
