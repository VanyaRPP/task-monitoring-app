import React from 'react'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Image } from 'antd'
import RoleSwitcher from 'common/components/UI/roleSwitcher'
import s from './style.module.scss'
import { useGetCurrentUserQuery } from '../../api/userApi/user.api'
import MyDomain from './my-domain'
import MyCompany from './my-company'
import MyDomainsCard from './my-domainCard'
import { Roles } from '@utils/constants'

const ProfilePage: React.FC = () => {
  const { data: user, isLoading: userLoading } = useGetCurrentUserQuery()

  return (
    <>
      <h2 className={s.Header}>Мій Профіль</h2>
      <div className={s.Container}>
        <Card loading={userLoading} title={user?.name} className={s.Profile}>
          <div className={s.Avatar}>
            <Avatar
              icon={<UserOutlined />}
              src={<Image src={user?.image || undefined} alt="User" />}
            />
          </div>
          <div className={s.Info}>
            <RoleSwitcher />
            {!user?.roles.includes(Roles.GLOBAL_ADMIN) && (
              <>
                <MyDomain />
                <MyCompany />
              </>
            )}
            <Card size="small" title="Електронна пошта">
              {user?.email}
            </Card>
          </div>
        </Card>

        <div className={s.DomainMyCard}>
          <Card title=" " loading={userLoading}>
            <MyDomainsCard />
          </Card>
        </div>
      </div>
    </>
  )
}

export default ProfilePage
