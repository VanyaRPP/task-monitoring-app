import { FC, useState } from "react"
import Link from "next/link"
import Router from 'next/router'
import { Avatar, Button, Card, Dropdown, Image, Menu } from "antd"
import { UserOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { signIn, signOut, useSession } from "next-auth/react"
import s from './style.module.scss'
import { log } from "console"
import { useGetUserByEmailQuery } from "../../api/userApi/user.api"
import RoleSwither from "../roleSwitcher"


const LoginUser = () => {

  const { data: session } = useSession()
  // const { data, error, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)

  const [menuActive, setMenuActive] = useState(false)

  function toSinginComponent() {
    if (session) {
      return (
        <>
          <Avatar
            icon={<UserOutlined />}
            src={<Image src={session?.user?.image} preview={false} style={{ width: 32 }} alt="UserImg" />}
            onClick={() => setMenuActive(prevState => !prevState)}
          />
          <div onClick={() => setMenuActive(false)} className={`${s.Info} ${menuActive ? s.active : ''}`}>
            <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={<Image src={session?.user?.image} preview={false} alt="UserImg" />}
              />
              <h2>{session?.user?.name}</h2>
              <p>{session?.user?.email}</p>
              <RoleSwither />
              <div className={s.Buttons}>
                <Button
                  type="link"
                  block
                  onClick={() => Router.push('/profile')}>
                  My Profile
                </Button>
                <Button
                  type="link"
                  block
                  onClick={() => signOut()}>
                  Sign out
                </Button>
              </div>
            </Card>
          </div>
        </>
      )
    }
    return (
      <>
        <Button
          onClick={() => signIn()}
          ghost
          danger
        >Sign in</Button>
      </>
    )
  }

  return (
    <>
      {
        toSinginComponent()
      }
    </>
  )
}

export default LoginUser