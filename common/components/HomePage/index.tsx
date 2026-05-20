import LottieAnimation from '@components/UI/LottieAnimation'
import SplashCursor from '@components/UI/SplashCursor'
import HomePageTitle from '@assets/svg/homePageTitle'
import { AppRoutes } from '@utils/constants'
import { LogoIcon } from '@assets/icon/Logo'
import { Button, Typography } from 'antd'
import { useRouter } from 'next/router'
import CardPage from '@components/CardSwapper'
import s from './style.module.scss'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <div className={s.HomePage}>
      <SplashCursor />

      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
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

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className={s.Header}>
          <div className={s.Logo}>
            <LogoIcon style={{ fontSize: '100px', color: 'white' }} />
            <HomePageTitle />
          </div>

          <div className={s.Buttons}>
            <Button
              type="primary"
              onClick={() => {
                router.push(AppRoutes.AUTH_SIGN_IN)
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
              <Typography.Title level={2} style={{ fontSize: '2rem', color: 'white' }}>
                Ласкаво просимо до E-ORENDA!
              </Typography.Title>
              <Typography.Paragraph style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.85)' }}>
                Керуйте процесом надання послуг нерухомості та систематизуйте
                відносини між користувачами за допомогою нашого сайту! Ресурс
                допоможе з автоматичним розрахунком платежів та своєчасним
                формуванням та виставленням рахунків. Вам, як надавачу послуг,
                платформа дозволить легко впоратися з усіма аспектами
                користування нерухомим майном. Забезпечте собі простоту,
                ефективність та зручність в управлінні!
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