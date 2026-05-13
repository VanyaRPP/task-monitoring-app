import LottieAnimation from '@components/UI/LottieAnimation'
import SplashCursor from '@components/UI/SplashCursor'
import HomePageTitle from '@assets/svg/homePageTitle'
import { AppRoutes } from '@utils/constants'
import { LogoIcon } from '@assets/icon/Logo'
import { Button, Typography } from 'antd'
import { useRouter } from 'next/router'
import CardPage from '@components/CardSwapper'
import ScrollFactoryAnimation from '@components/ScrollFactoryAnimation'
import s from './style.module.scss'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <>
      {/* <SplashCursor /> */}
      <div className={s.HomePage}>
        {/* <div className={s.Logo}>
          <LogoIcon style={{ fontSize: '32px' }} />
          <HomePageTitle />
        </div> */}

        <div className={s.Header}>
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
              onClick={() => {
                router.push(AppRoutes.CONTACTS)
              }}
            >
              Зв’яжіться з нами
            </Button>
          </div>
        </div>

        <ScrollFactoryAnimation />

      </div>
    </>
  )
}

export default HomePage
