import Link from 'next/link'
import { Layout } from 'antd'
import LoginUser from '../LoginUser'
import style from './style.module.scss'
import { SearchBar } from '../SearchBar'
import ThemeSwitcher from '../ThemeSwitcher'
import TaskButton from '../TaskButton'
import { AppRoutes } from '../../utils/constants'

const MainHeader: React.FC = () => {
  return (
    <Layout.Header className={style.Header}>
      <div className={style.Item}>
        <Link href={AppRoutes.INDEX}>
          <h1 className={style.Logo}>LOGO</h1>
        </Link>
        <SearchBar className={style.SearchBarHeader} />
        <TaskButton />
        <ThemeSwitcher />
      </div>
      <LoginUser />
    </Layout.Header>
  )
}

export default MainHeader
