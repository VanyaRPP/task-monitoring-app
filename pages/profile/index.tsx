import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Image } from 'antd'
import { FC, useEffect, useState } from 'react'
import s from './style.module.scss'
import { useGetUserByEmailQuery, useUpdateUserMutation } from '../../api/userApi/user.api'
import RoleSwither from '../../components/roleSwitcher'
import withAuthRedirect from '../../components/HOC/withAuthRedirect';
import { useSession } from 'next-auth/react'


const Profile: FC = () => {

  const { data: session } = useSession()

  const { data, error, isLoading } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = data?.data

  const [
    updateUser,
    { isLoading: isUpdating },
  ] = useUpdateUserMutation()

  return (
    <div className={s.Container}>
      <div className={s.HalfBlock}>
        <Avatar
          size={300}
          icon={<UserOutlined />}
          src={<Image src={session?.user?.image || undefined} alt="User" />}
        />

      </div>
      <div className={s.HalfBlock}>
        <h2>My profile</h2>
        <Card
          loading={isLoading}
          size="small">
          <h2>{user?.name}</h2>
          <h3>{user?.role}</h3>
          <RoleSwither />
        </Card>
        <Card
          loading={isLoading}
          size="small"
          title="Email"
        >
          <p>{user?.email}</p>
        </Card>
        <Card
          loading={isLoading}
          title="General information"
          actions={[
            <EditOutlined key="edit" />,
          ]}
        >
          <Card
            loading={isLoading}
            size="small">
            <p>City: Zhytomyr</p>
          </Card>
          {/* <Card
            loading={isLoading}
            size="small">
            <p>Date of birdth: {Date()}</p>
          </Card> */}
        </Card>
      </div>
    </div >
  )
}

export default withAuthRedirect(Profile)