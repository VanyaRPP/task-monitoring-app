import { MenuOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Drawer, Avatar, Image } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { signIn, signOut, useSession } from 'next-auth/react'
import Router from 'next/router'
import { useState } from 'react'
import PremiumPage from '../../../pages/premium'
import { AppRoutes } from '../../../utils/constants'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'
import premiumIcon from '../../assets/premium/diamond.png'
import Diamant from '../../assets/svg/diamant'
import LogoCircle from '../../assets/svg/logo_circle'
import LoginUser from '../LoginUser'
import s from './style.module.scss'
import ThemeSwitcher from '../UI/ThemeSwitcher'

const BurgerMenu: React.FC = () => {
  const [isActive, setIsActive] = useState(false)
  const showDrawer = () => {
    setIsActive(!isActive)
  }

  const onClose = () => {
    setIsActive(false)
  }

  const { data: session, status } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

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
        drawerStyle={{ background: 'var(--backgroundColor)' }}
        className={s.Drawer}
        width="70%"
      >
        <div className={s.Buttons}>
          {status == 'authenticated' ? (
            <Card onClick={(e) => e.stopPropagation()} className={s.Card}>
              <Avatar
                className={s.Image}
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
            </Card>
          ) : null}
          {/* <div>
              <Avatar
              className={s.Image}
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
            </div> */}

          <div className={s.Points}>
            {status == 'authenticated' ? (
              <div>
                <div
                  className={s.Button}
                  onClick={() => Router.push(AppRoutes.PROFILE)}
                >
                  <span>Профіль</span>
                </div>
                <Divider className={s.Divider} />
              </div>
            ) : null}
            {user?.role === 'Admin' && (
              <div
                className={s.Button}
                onClick={() => Router.push(AppRoutes.ADMIN)}
              >
                <span>Панель адміна</span>
              </div>
            )}
            <Divider className={s.Divider} />
            <div
              className={s.Button}
              onClick={() => {
                Router.push(AppRoutes.CONTACTS)
              }}
            >
              <span>Контакти</span>
            </div>
            <Divider className={s.Divider} />
            {status == 'authenticated' ? (
              <div
                className={s.Button}
                onClick={() => {
                  signOut()
                }}
              >
                <span>Вийти</span>
              </div>
            ) : (
              <>
                <div
                  className={s.Button}
                  onClick={() => {
                    Router.push(AppRoutes.AUTH_SIGN_IN)
                  }}
                >
                  <span>Увійти</span>
                </div>
                <Divider className={s.Divider} />
                <div
                  className={s.Button}
                  onClick={() => {
                    Router.push(AppRoutes.AUTH_SIGN_UP)
                  }}
                >
                  <span>Зареєструватися</span>
                </div>
              </>
            )}
            <Divider className={s.Divider} />
            <div
              className={s.ButtonPremium}
              onClick={() => Router.push(AppRoutes.PREMIUM)}
            >
              <Diamant className={s.Diamant} />
              <span>Преміум</span>
            </div>
            <Divider className={s.Divider} />
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default BurgerMenu
