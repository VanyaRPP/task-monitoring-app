import Link from "next/link"
import Router, { useRouter } from 'next/router'
import { useSession } from "next-auth/react"
import { Layout, Menu, Input, Button } from 'antd'
import { selectUser } from '../../features/user/userSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import LoginUser from '../LoginUser'
import NavBarItem from "../UI/NavBarItem"
import s from './style.module.scss'


const MainHeader: React.FC = () => {

  const { status } = useSession()

  const router = useRouter()

  const onSearch = (value: string) => console.log(value)

  const menuItems = [
    {
      key: 'login',
      label: (
        <LoginUser />
      )
    }
  ]

  let taskButton = null

  if (status === "authenticated" && router.route === '/task') {
    taskButton = <Button
      onClick={() => Router.push('/task/addtask')}
      ghost
      danger
      className={s.Button}>
      Add task
    </Button>
  } else if (status === "authenticated") {
    taskButton = <Button
      onClick={() => Router.push('/task')}
      ghost
      danger
      className={s.Button}>
      Tasks
    </Button>
  }

  return (
    <Layout.Header className={s.Header}>
      <div className={s.Item}>
        <Link href='/'>
          <h1 className={s.Logo}>LOGO</h1>
        </Link>
        <Input.Search
          placeholder='input search text'
          onSearch={onSearch}
          enterButton
          className={s.Search} />
        {
          taskButton
        }
      </div>
      <Menu theme='light' mode='horizontal' items={menuItems} className={s.Menu} />
    </Layout.Header >
  )
}

export default MainHeader