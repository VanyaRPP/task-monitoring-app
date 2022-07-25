import { MenuOutlined } from '@ant-design/icons'
import { Button, Divider, Drawer } from 'antd'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Router from 'next/router'
import { useState } from 'react'
import PremiumPage from '../../../pages/premium'
import { AppRoutes } from '../../../utils/constants'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'
import premiumIcon from '../../assets/premium/diamond.png'
import Diamant from '../../assets/svg/diamant'
import LogoCircle from '../../assets/svg/logo_circle'
import LoginUser from '../LoginUser'
import { SearchBar } from '../UI/SearchBar'
import s from './style.module.scss'

const BurgerMenu: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const showDrawer = () => {
    setIsActive(!isActive)
  }

  const onClose = () => {
    setIsActive(false)
  }

  const { data: session, status } = useSession()

  const { data, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const userName = session?.user?.name
  const userEmail = session?.user?.email

  return (
    <>
      <div className={s.Menu} onClick={showDrawer}>
        <div className={isActive ? s.ChangeBurger : null}>
          <div className={s.FirstLine}></div>
          <div className={s.SecondLine}></div>
          <div className={s.ThirdLine}></div>
        </div>
      </div>
      <Drawer
        onClose={onClose}
        placement="left"
        closable={false}
        visible={isActive}
        className={s.Drawer}
        width="70%"
      >
        <div className={s.Buttons}>
          <div className={s.UserInfo}>
            <LoginUser />
            <span>{userName}</span>
            <span>{userEmail}</span>
          </div>
          <div className={s.Points}>
            <div
              className={s.Premium}
              onClick={() => Router.push(AppRoutes.PREMIUM)}
            >
              <span>Преміум</span>
              <Diamant className={s.Diamant} />
              {/* <Image
                src={premiumIcon}
                alt="Premium"
                width={25}
                height={25}
                className={s.Image}
              /> */}
            </div>
            <Divider className={s.Divider} />
            {status == 'authenticated' ? (
              <div
                className={s.SignIn}
                onClick={() => {
                  signOut()
                }}
              >
                <span>Вийти</span>
              </div>
            ) : (
              <div
                className={s.SignIn}
                onClick={() => {
                  Router.push(AppRoutes.AUTH_SIGN_IN)
                }}
              >
                <span>Увійти</span>
              </div>
            )}

            <Divider className={s.Divider} />
            <div
              className={s.SignIn}
              onClick={() => {
                Router.push(AppRoutes.CONTACTS)
              }}
            >
              <span>Contact us</span>
            </div>
            <Divider className={s.Divider} />
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default BurgerMenu
