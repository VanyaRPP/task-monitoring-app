import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Layout, Input, Button } from 'antd'
import LoginUser from '../LoginUser'
import s from './style.module.scss'
import { SearchBar } from '../SearchBar'
import { useMemo } from 'react'

const MainHeader: React.FC = () => {
  const { status } = useSession()

  const router = useRouter()

  let taskButton = null

  if (status === 'authenticated' && router.route === '/task') {
    taskButton = (
      <Button
        onClick={() => Router.push('/task/addtask')}
        ghost
        type="primary"
        className={s.Button}
      >
        Add task
      </Button>
    )
  } else if (status === 'authenticated') {
    taskButton = (
      <Button
        onClick={() => Router.push('/task')}
        ghost
        type="primary"
        className={s.Button}
      >
        Tasks
      </Button>
    )
  }

  return (
    <Layout.Header className={s.Header}>
      <div className={s.Item}>
        <Link href="/">
          <h1 className={s.Logo}>LOGO</h1>
        </Link>
        <SearchBar className={s.SearchBarHeader} />
        {taskButton}
      </div>
      <LoginUser />
    </Layout.Header>
  )
}

export default MainHeader
