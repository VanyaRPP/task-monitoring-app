import { Button } from 'antd'
// import Tool from '../../assets/svg/Tool'
import style from './style.module.scss'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'
import cityImg from './../../public/city.png'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <>
      <h1 className={style.Header}>Ваш електронний жек: Комунальник</h1>
      <div className={style.Container}>
        <div className={style.HalfBlock}>
          <Image src={cityImg} alt="City" />
        </div>
        <div className={style.HalfBlock}>
          <p className={style.Text}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur
            ducimus incidunt modi laborum voluptas asperiores id fuga debitis
            est vitae!
          </p>
        </div>
      </div>
      <div className={style.Buttons}>
        <Button
          type="primary"
          className={style.Button}
          onClick={() => {
            router.push(AppRoutes.AUTH_SIGNIN)
          }}
        >
          Login
        </Button>
        <Button
          type="primary"
          className={style.Button}
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
