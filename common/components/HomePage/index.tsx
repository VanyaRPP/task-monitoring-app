import { Button, Skeleton, Space, Steps } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import cityImg1 from '../../assets/images/city.png'
import cityImg2 from '../../assets/images/city2.png'
import s from './style.module.scss'
import HomePageTitle from '@common/assets/svg/homePageTitle'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <>
      <div className={s.Title}>
        <HomePageTitle />
      </div>

      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <div className={s.Image}>
            <Image src={cityImg1} alt="City" />
            <Image src={cityImg2} alt="City" />
          </div>
        </div>

        <div className={s.HalfBlock}>
          <div className={s.Text}>
            <p>
              Керуйте процесом надання послуг нерухомості та систематизуйте відносини між користувачами за допомогою
              нашого сайту! Ресурс допоможе з автоматичним розрахунком платежів
              та своєчасним формуванням та виставленням рахунків. Вам, як надавачу 
              послуг, платформа дозволить легко впоратися з усіма
              аспектами користування нерухомим майном. Забезпечте собі простоту,
              ефективність та зручність в управлінні!
            </p>
          </div>
        </div>
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
    </>
  )
}

export default HomePage
