import { UserOutlined } from '@ant-design/icons'
import { Avatar, Image } from 'antd'
import { ObjectId } from 'mongoose'
import React, { FC } from 'react'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import s from './style.module.scss'

interface Props {
  id: ObjectId | string
}
const MicroInfoProfile: FC<Props> = ({ id }) => {
  const { data } = useGetUserByIdQuery(`${id}`)
  const user = data?.data
  return (
    <div className={s.microDiv}>
      <Avatar
        icon={<UserOutlined />}
        src={<Image src={user?.image} preview={false} alt="Користувач" />}
      />
      <p>{user?.name || user?.email}</p>
    </div>
  )
}

export default MicroInfoProfile
