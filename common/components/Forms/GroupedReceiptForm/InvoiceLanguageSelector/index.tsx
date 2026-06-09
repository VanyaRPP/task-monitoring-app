import { FC } from 'react'
import s from './style.module.scss'

interface Props {
  lang: 'en' | 'uk'
  onChange: (lang: 'en' | 'uk') => void
}

const InvoiceLanguageSelector: FC<Props> = ({ lang, onChange }) => (
  <div className={s.container}>
    <button
      className={`${s.btn} ${lang === 'uk' ? s.active : ''}`}
      onClick={() => onChange('uk')}
    >
      UA
    </button>
    <button
      className={`${s.btn} ${lang === 'en' ? s.active : ''}`}
      onClick={() => onChange('en')}
    >
      EN
    </button>
  </div>
)

export default InvoiceLanguageSelector
