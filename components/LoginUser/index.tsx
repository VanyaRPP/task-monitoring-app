import { FC, useState } from 'react'
import Router from 'next/router'
import { Avatar, Button, Card, Image } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { signIn, signOut, useSession } from 'next-auth/react'
import RoleSwither from '../roleSwitcher'
import { AppRoutes } from '../../utils/constants'
import s from './style.module.scss'

const LoginUser: FC = () => {
  const { data: session } = useSession()

  const [menuActive, setMenuActive] = useState(false)

  if (!session?.user) {
    return (
      <>
        <Button
          onClick={() => signIn()}
          ghost
          type="primary"
          className={s.Button}
        >
          Sign in
        </Button>
      </>
    )
  }

  return (
    <>
      <div
        className={s.Avatar}
        onClick={() => setMenuActive((prevState) => !prevState)}
      >
        <Avatar
          icon={<UserOutlined />}
          src={
            <Image
              src={session?.user?.image || undefined}
              preview={false}
              style={{ width: 32 }}
              alt="UserImg"
            />
          }
        />
      </div>
      <div
        onClick={() => setMenuActive(false)}
        className={`${s.Info} ${menuActive ? s.active : ''}`}
      >
        <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={
              <Image
                src={session?.user?.image || undefined}
                preview={false}
                alt="UserImg"
              />
            }
          />

          <h2>{session?.user?.name}</h2>
          <p>{session?.user?.email}</p>

          <RoleSwither />

          <div className={s.Buttons}>
            <Button
              type="link"
              block
              onClick={() => Router.push(AppRoutes.PROFILE)}
            >
              My Profile
            </Button>
            <Button type="link" block onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}

export default LoginUser
