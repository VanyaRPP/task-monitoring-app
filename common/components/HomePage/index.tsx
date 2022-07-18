import { Button } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import cityImg1 from '../../assets/images/city.png'
import cityImg2 from '../../assets/images/city2.png'
import s from './style.module.scss'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <>
      <h1 className={s.Header}>Ваш електронний жек: Комунальник</h1>

      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <div className={s.Image}>
            <Image src={cityImg1} alt="City" />
            <Image src={cityImg2} alt="City" />
          </div>
        </div>

        <div className={s.HalfBlock}>
          <div className={s.Text}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur
            ducimus incidunt modi laborum voluptas asperiores id fuga debitis
            est vitae!
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
          Login
        </Button>

        <Button
          ghost
          type="primary"
          className={s.Button}
          onClick={() => {
            router.push(AppRoutes.CONTACTS)
          }}
        >
          Contact us
        </Button>
      </div>
    </>
  )
}

export default HomePage
