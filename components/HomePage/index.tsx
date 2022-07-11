import { Button } from 'antd'
// import Tool from '../../assets/svg/Tool'
import s from './style.module.scss'
import Image from 'next/image'
import { calculateProvidedBy } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../utils/constants'

const HomePage: React.FC = () => {
  const router = useRouter()
  return (
    <>
      <div className={s.Block}>
        <div className={s.Home}>Ваш електронний жек: Комунальник</div>
        <div className={s.Block2}>
          <div className={s.HalfBlock}>
            <Image
              src="/city.png"
              alt="City"
              width={700}
              height={500}
              layout="fixed"
            />
          </div>
          <div className={s.HalfBlock}>
            <div className={s.Block3}>
              <p className={s.Text}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur
                ducimus incidunt modi laborum voluptas asperiores id fuga
                debitis est vitae!
              </p>
            </div>
            <Button
              type="primary"
              className={s.Button}
              onClick={() => {
                router.push(AppRoutes.AUTH_SIGN_IN)
              }}
            >
              LOGIN
            </Button>
            <Button
              type="primary"
              className={s.Button}
              onClick={() => {
                router.push(AppRoutes.CONTACTS)
              }}
            >
              Contact us
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomePage
