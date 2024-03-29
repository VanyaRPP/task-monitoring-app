import Link from 'next/link'
import { AppRoutes } from '../../../utils/constants'
import LogoCircle from '../../assets/svg/logo_circle'
import NewLogo from '../../assets/svg/newLogo'
import s from './style.module.scss'

const Logo: React.FC = () => {
  return (
    <Link href={AppRoutes.INDEX}>
      <div className={s.All}>
        {/* <LogoCircle className={s.Logo} /> */}
        <NewLogo className={s.Logo} />
      </div>
    </Link>
  )
}

export default Logo
