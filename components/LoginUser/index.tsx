import { FC } from "react"
import Link from "next/link"
import { Avatar, Button, Card, Dropdown, Image, Menu } from "antd"
import s from './style.module.sass'
import { UserOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { login, logout, selectUser } from "../../features/user/userSlice"
import { signIn, signOut, useSession } from "next-auth/react"

// interface Props {
//   user: boolean
// }



const LoginUser = () => {

  const { data: session } = useSession()
  const dispatch = useAppDispatch()
  const count = useAppSelector(selectUser)

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
          <p>User/Worker/Moder</p>
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
        // <>
        //   Signed in as {session.user.email} <br />
        //   <button >Sign out</button>
        // </>
        <Dropdown overlay={menu} >
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
        {/* <button onClick={() => signIn()}>Sign in</button> */}
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