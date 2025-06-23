import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setDayjsLocale } from '@common/assets/features/formatDate'
import s from './style.module.scss'

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState(i18n.language)

  useEffect(() => {
    setDayjsLocale(language)
  }, [language])

  useEffect(() => {
    const savedLang = localStorage.getItem('language')
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang)
      setLanguage(savedLang)
    }
  }, [])

  const handleChange = (lang: string) => {
    if (lang !== language) {
      i18n.changeLanguage(lang)
      setLanguage(lang)
      localStorage.setItem('language', lang)
    }
  }

  return (
    <div className={s.wrapper}>
      <button
        onClick={() => handleChange('uk')}
        className={`${s.btn} ${language === 'uk' ? s.active : ''}`}
      >
        UK
      </button>
      <div className={s.divider}>|</div>
      <button
        onClick={() => handleChange('en')}
        className={`${s.btn} ${language === 'en' ? s.active : ''}`}
      >
        EN
      </button>
    </div>
  )
}

export default LanguageSwitcher
