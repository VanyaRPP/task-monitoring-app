import LottieAnimation from '@components/UI/LottieAnimation'
import HomePageTitle from '@assets/svg/homePageTitle'
import { AppRoutes } from '@utils/constants'
import { LogoIcon } from '@assets/icon/Logo'
import { Button, Typography } from 'antd'
import { useRouter } from 'next/router'

import s from './style.module.scss'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <div className={s.HomePage}>
      <LottieAnimation
        src="/animations/WaveForBG.json"
        loop
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 'auto',
          height: '100%',
          objectFit: 'cover',
          transform: 'rotate(180deg)',
        }}
      />
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
            <Typography.Title level={2} style={{ fontSize: '2rem' }}>
              Ласкаво просимо до E-ORENDA!
            </Typography.Title>
            <Typography.Paragraph style={{ fontSize: '1.3rem' }}>
              Керуйте процесом надання послуг нерухомості та систематизуйте
              відносини між користувачами за допомогою нашого сайту! Ресурс
              допоможе з автоматичним розрахунком платежів та своєчасним
              формуванням та виставленням рахунків. Вам, як надавачу послуг,
              платформа дозволить легко впоратися з усіма аспектами користування
              нерухомим майном. Забезпечте собі простоту, ефективність та
              зручність в управлінні!
            </Typography.Paragraph>
          </div>
        </div>
        <div className={s.HalfBlock}>
          <LottieAnimation
            src="/animations/AnimationCity.json"
            // src="https://assets7.lottiefiles.com/packages/lf20_qp1q7mct.json"
            loop={true}
          />
        </div>
      </div>
    </div>
  )
}

export default HomePage
