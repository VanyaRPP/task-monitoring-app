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
      <h3 className={`${s.HeaderMobile} ${s.Smaller1}`}>Ваше електронне</h3>
      <h1 className={s.Komunalnik}>Комунальник</h1>
      <h3 className={`${s.HeaderMobile} ${s.Smaller2}`}>
        житлово-комунальне господарство
      </h3>
      <h3 className={s.Header}>
        Ваше електронне житлово-комунальне господарство
      </h3>

      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <div className={s.Image}>
            <Image src={cityImg1} alt="City" />
            <Image src={cityImg2} alt="City" />
          </div>
        </div>

        <div className={s.HalfBlock}>
          <div className={s.Text}>
            Вітаємо Вас на платформі електронних замовлень для домогосподарств.
            Тут Ви можете замовити або отримати роботу по встановленню/ремонту
            сантехніки, електрики, теплотехніки, кондиціонування та вентиляції,
            загальнобудівельним, столярним роботам (вікна, двері) та багато
            іншого.
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
          Логін
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
