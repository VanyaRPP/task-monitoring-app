'use client'

import { UserOutlined } from '@ant-design/icons'
import RoleSwitcher from '@components/UI/roleSwitcher'
import { Roles } from '@utils/constants'
import { Avatar, Card } from 'antd'
import NextImage from 'next/image'
import React from 'react'
import { useGetCurrentUserQuery } from '../../api/userApi/user.api'
import MyCompany from './my-company'
import MyDomain from './my-domain'
import MyDomainsCard from './my-domainCard'
import s from './style.module.scss'

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
              size={280}
              src={
                <NextImage
                  src={user?.image || undefined}
                  width={280}
                  height={280}
                  alt="avatar"
                />
              }
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
