import { FC } from "react"
import Link from "next/link"
import { Avatar, Button, Dropdown, Image, Menu } from "antd"
import s from './style.module.sass'
import { UserOutlined } from "@ant-design/icons"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { login, logout, selectUser } from "../../features/user/userSlice"

interface Props {
  user: boolean
}



const LoginUser: FC<Props> = ({ user }) => {

  const dispatch = useAppDispatch()
  const count = useAppSelector(selectUser)

  const menu = (
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
              onClick={() => dispatch(logout())}
            >
              Log out
            </a>
          ),
        }
      ]}
    />
  );

  return (
    <div>
      {
        !user ?
          <>
            <Link href='/auth/login'>
              <a>Log in</a>
            </Link>
            <Link href='/auth/registration'>
              <Button ghost danger>Do work</Button>
            </Link>
          </>
          :
          <>
            <Dropdown overlay={menu} >
              <Avatar
                icon={<UserOutlined />}
                src={<Image src="https://joeschmoe.io/api/v1/random" preview={false} style={{ width: 32 }} alt="User" />}
              />
            </Dropdown>

          </>
      }
    </div>
  )
}

export default LoginUser