import { FC } from "react"
import Link from "next/link"
import { Avatar, Button, Card, Dropdown, Image, Menu } from "antd"
import { UserOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { signIn, signOut, useSession } from "next-auth/react"
import s from './style.module.sass'
import { log } from "console"
import { useGetUserByEmailQuery } from "../../api/userApi/user.api"
import RoleSwither from "../roleSwitcher"



const LoginUser = () => {

  const { data: session } = useSession()
  const { data, error, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data
  console.log(data);


  const menu = (
    <>
      <Card>
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: "center", justifyContent: 'center' }}
        >
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={<Image src={session?.user?.image} preview={false} alt="UserImg" />}
          />
          <h2>{session?.user?.name}</h2>
          <p>{session?.user?.email}</p>
          <RoleSwither />
        </div>


        <Menu
          items={[
            {
              key: '1',
              label: (
                <Link href='/profile'>
                  <a>
                    My Profile
                  </a>
                </Link>
              ),
            },
            {
              key: '2',
              label: (
                <a
                  onClick={() => signOut()}
                >
                  Log out
                </a>
              ),
            }
          ]}
        />
      </Card>
    </>
  )

  function toSinginComponent() {

    if (session) {
      return (
        <Dropdown overlay={menu}>
          <Avatar
            icon={<UserOutlined />}
            src={<Image src={session.user.image} preview={false} style={{ width: 32 }} alt="UserImg" />}
          />
        </Dropdown>
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