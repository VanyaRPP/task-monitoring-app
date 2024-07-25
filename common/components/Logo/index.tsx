import NewLogo from '@assets/svg/newLogo'
import { AppRoutes } from '@utils/constants'
import Link from 'next/link'
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
