import LottieAnimation from '@components/UI/LottieAnimation'
import SplashCursor from '@components/UI/SplashCursor'
import HomePageTitle from '@assets/svg/homePageTitle'
import { AppRoutes } from '@utils/constants'
import { isProd } from '@utils/env'
import { LogoIcon } from '@assets/icon/Logo'
import { Button, Typography } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import CardPage from '@components/CardSwapper'
import s from './style.module.scss'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <div className={s.HomePage}>
      <SplashCursor />

      <div className={s.WaveBg}>
        <LottieAnimation
          src="/animations/WaveForBG.json"
          loop
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'rotate(180deg) scale(1.05)',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <div className={s.Header}>
          <div className={s.Logo}>
            <LogoIcon
              style={{ fontSize: '100px', color: 'var(--hero-text)' }}
            />
            <HomePageTitle />
          </div>

          <div className={s.Buttons}>
            <Button
              type="primary"
              onClick={() => {
                if (isProd) {
                  signIn('google')
                } else {
                  router.push(AppRoutes.AUTH_SIGN_IN)
                }
              }}
            >
              Увійти
            </Button>

            <Button
              ghost
              type="primary"
              className={s.Button}
              onClick={() => {
                router.push(AppRoutes.CONTACTS)
              }}
            >
              Зв’яжіться з нами
            </Button>
          </div>
        </div>

        <div className={s.Container}>
          <div className={s.HalfBlock}>
            <div className={s.TextGlassCard}>
              <Typography.Title level={2} className={s.heroTitle}>
                Ласкаво просимо до E-ORENDA!
              </Typography.Title>
              <Typography.Paragraph className={s.heroText}>
                E-ORENDA автоматизує виставлення рахунків від першого до
                останнього кроку: підтягує дані з банку, сама рахує суми за
                вашими формулами та послугами й генерує десятки персоналізованих
                інвойсів за один клік. Готові рахунки система доставляє клієнтам
                у Telegram, на email або PDF, а ви бачите оплати, баланс і
                боржників у реальному часі.
              </Typography.Paragraph>
            </div>
          </div>
          <div className={s.HalfBlock}>
            <div className={s.cardPage}>
              <CardPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
