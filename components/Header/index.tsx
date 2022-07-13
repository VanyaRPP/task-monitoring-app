import Link from 'next/link'
import { Layout } from 'antd'
import LoginUser from '../LoginUser'
import s from './style.module.scss'
import { SearchBar } from '../SearchBar'
import ThemeSwitcher from '../UI/ThemeSwitcher'
import TaskButton from '../TaskButton'
import { AppRoutes } from '../../utils/constants'

const Header: React.FC = () => {
  return (
    <Layout.Header className={s.Header}>
      <div className={s.Item}>
        <Link href={AppRoutes.INDEX}>
          <h1 className={s.Logo}>LOGO</h1>
        </Link>
        <SearchBar className={s.Search} />
        <TaskButton />
        <ThemeSwitcher />
      </div>
      <LoginUser />
    </Layout.Header>
  )
}

export default Header
