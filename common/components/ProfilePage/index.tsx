import React from 'react'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Image, Input } from 'antd'
import RoleSwitcher from 'common/components/UI/roleSwitcher'
import s from './style.module.scss'
import { useGetCurrentUserQuery } from '../../api/userApi/user.api'
import MyDomain from './my-domain'

const ProfilePage: React.FC = () => {
  const { data: user, isLoading } = useGetCurrentUserQuery()

  return (
    <>
      <h2 className={s.Header}>Мій Профіль</h2>
      <div className={s.Container}>
        <Card
          loading={isLoading}
          title={user?.name}
          className={s.Profile}
          // extra={
          //   user?.roles?.includes(Roles.GLOBAL_ADMIN) && (
          //     <Button
          //       type="link"
          //       onClick={() => Router.push(AppRoutes.ADMIN)}
          //       className={s.Admin}
          //     >
          //       Панель Адміністратора
          //     </Button>
          //   )
          // }
        >
          <div className={s.Avatar}>
            <Avatar
              icon={<UserOutlined />}
              src={<Image src={user?.image || undefined} alt="User" />}
            />
          </div>
          <div className={s.Info}>
            <RoleSwitcher />
            <MyDomain />
            <Card size="small" title="Електронна пошта">
              {user?.email}
            </Card>
            {/* <Card size="small" title="Номер телефону">
              <Input
                name="tel"
                value={user?.tel}
                placeholder="Введіть номер телефону"
              />
            </Card> */}
          </div>
        </Card>
        {/* <FeedbacksCard user={user} loading={isLoading} userRate={userRate} /> */}
      </div>
    </>
  )
}

export default ProfilePage
