import Link from 'next/link'
import { AppRoutes } from '../../../utils/constants'
import LogoCircle from '../../assets/svg/logo_circle'
import s from './style.module.scss'

const Logo: React.FC = () => {
  return (
    <>
      <div className={s.All}>
        <Link href={AppRoutes.INDEX}>
          <LogoCircle className={s.Logo} />
        </Link>
        <h1 className={s.Title}>КОМУНАЛЬНИК</h1>
      </div>
    </>
  )
}

export default Logo
