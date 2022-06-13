import { Button, Layout } from 'antd'
import Link from "next/link"
import NavBarItem from "../UI/NavBarItem"
import s from './style.module.sass'

const { Header } = Layout;

const MainHeader = () => {
  return (

    <Header className={s.Header}>
      <Link href='/'>
        <h1>LOGO</h1>
      </Link>
      <Link href='/'>
        <a>Home</a>
      </Link>
      <div>
        <Link href='/auth/login'>
          <a>Log in</a>
        </Link>
        <Link href='/auth/registration'>
          <Button ghost danger>Do work</Button>
        </Link>
      </div>
    </Header>
  )
}

export default MainHeader