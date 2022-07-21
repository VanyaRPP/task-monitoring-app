import { MenuOutlined } from '@ant-design/icons'
import { Button, Drawer } from 'antd'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import Router from 'next/router'
import { useState } from 'react'
import { AppRoutes } from '../../../utils/constants'
import premiumIcon from '../../assets/premium/diamond.png'
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
        title="Menu"
        placement="left"
        closable={false}
        onClose={onClose}
        visible={isActive}
        className={s.Drawer}
      >
        <div className={s.Buttons}>
          <SearchBar className={s.Search} />
          <div
            className={s.Premium}
            onClick={() => Router.push(AppRoutes.PREMIUM)}
          >
            <Image src={premiumIcon} alt="Premium" width={25} height={25} />
            <span>Premium</span>
          </div>
          <div className={s.SignIn}>
            <Button
              onClick={() => signIn()}
              ghost
              type="primary"
              className={s.Button}
            >
              Sign in
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default BurgerMenu
