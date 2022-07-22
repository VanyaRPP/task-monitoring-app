import { MenuOutlined } from '@ant-design/icons'
import { Button, Divider, Drawer } from 'antd'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import Router from 'next/router'
import { useState } from 'react'
import PremiumPage from '../../../pages/premium'
import { AppRoutes } from '../../../utils/constants'
import premiumIcon from '../../assets/premium/diamond.png'
import Diamant from '../../assets/svg/diamant'
import { SearchBar } from '../UI/SearchBar'
import s from './style.module.scss'

const BurgerMenu: React.FC = () => {
  const [isActive, setIsActive] = useState(false)

  const showDrawer = () => {
    setIsActive(true)
  }

  const onClose = () => {
    setIsActive(false)
  }

  return (
    <>
      <Button
        type="primary"
        icon={<MenuOutlined />}
        onClick={showDrawer}
        className={s.Menu}
      />
      <Drawer
        headerStyle={{
          backgroundColor: 'var(--primaryColorHover)',
          textAlign: 'center',
        }}
        drawerStyle={{
          backgroundColor: 'var(--backgroundColor)',
        }}
        onClose={onClose}
        title="Menu"
        placement="left"
        closable={false}
        visible={isActive}
        className={s.Drawer}
        width="70%"
      >
        <div className={s.Buttons}>
          <SearchBar className={s.Search} />
          <div className={s.Points}>
            <div
              className={s.Premium}
              onClick={() => Router.push(AppRoutes.PREMIUM)}
            >
              <span>Premium</span>
              <Diamant className={s.Diamant} />
            </div>
            <Divider className={s.Divider} />
            <div
              className={s.SignIn}
              onClick={() => {
                Router.push(AppRoutes.AUTH_SIGN_IN)
              }}
            >
              Sign in
            </div>
            <Divider className={s.Divider} />
            <div
              className={s.SignIn}
              onClick={() => {
                Router.push(AppRoutes.CONTACTS)
              }}
            >
              Contact us
            </div>
            <Divider className={s.Divider} />
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default BurgerMenu
