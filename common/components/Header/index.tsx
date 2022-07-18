import Link from 'next/link'
import { Button, Layout } from 'antd'
import LoginUser from '../LoginUser'
import { SearchBar } from '../SearchBar'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import TaskButton from '../UI/Buttons/TaskButton'
import { AppRoutes } from 'utils/constants'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import premiumIcon from '../../assets/premium/diamond.png'
import Image from 'next/image'

const Header: React.FC = () => {
  const { status } = useSession()

  status === 'authenticated'
  return (
    <Layout.Header className={s.Header}>
      <div className={s.Item}>
        <Link href={AppRoutes.INDEX}>
          <h1 className={s.Logo}>LOGO</h1>
        </Link>
        {status === 'authenticated' ? (
          <SearchBar className={s.Search} />
        ) : (
          <Button
            icon={
              <Image src={premiumIcon} alt="Premium" width={25} height={25} />
            }
            className={s.Button_Premium}
            type="primary"
            onClick={() => Router.push(AppRoutes.PREMIUM)}
          >
            &nbsp; Premium plan
          </Button>
        )}
        <TaskButton />
        <ThemeSwitcher />
      </div>
      <LoginUser />
    </Layout.Header>
  )
}

export default Header
