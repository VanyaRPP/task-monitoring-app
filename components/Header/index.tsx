import { Button, Layout } from 'antd'
import Link from "next/link"
import { selectUser } from '../../features/user/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import LoginUser from '../LoginUser';
import NavBarItem from "../UI/NavBarItem"
import s from './style.module.sass'

const { Header } = Layout;



const MainHeader = () => {

  return (
    <Header className={s.Header}>
      <Link href='/'>
        <h1>LOGO</h1>
      </Link>
      <LoginUser />
    </Header>
  )
}

export default MainHeader