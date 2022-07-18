import { useState } from 'react'
import Router from 'next/router'
import { Avatar, Button, Card, Image } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { signIn, signOut, useSession } from 'next-auth/react'
import { AppRoutes } from '../../../utils/constants'
import classNames from 'classnames'
import s from './style.module.scss'
import AdminButton from '../UI/Buttons/AdminButton/index'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'

const LoginUser: React.FC = () => {
  const [menuActive, setMenuActive] = useState(false)

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

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
        className={classNames(s.Info, { [s.Active]: menuActive })}
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
          {user?.role === 'Admin' && (
            <Button type="link" onClick={() => Router.push(AppRoutes.ADMIN)}>
              Admin Panel
            </Button>
          )}
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
