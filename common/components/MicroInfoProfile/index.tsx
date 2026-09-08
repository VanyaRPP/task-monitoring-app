import { UserOutlined } from '@ant-design/icons'
import { Avatar, Image } from 'antd'
import { ObjectId } from 'mongoose'
import React, { FC } from 'react'
import { TruncatedText } from '@components/UI/TruncatedText'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import s from './style.module.scss'

interface Props {
  id: ObjectId | string
}
const MicroInfoProfile: FC<Props> = ({ id }) => {
  const { data: user } = useGetUserByIdQuery(`${id}`)
  return (
    <div className={s.microDiv}>
      <Avatar
        icon={<UserOutlined />}
        src={<Image src={user?.image} preview={false} alt="Користувач" />}
      />
      <TruncatedText as="p" text={user?.name || user?.email} />
    </div>
  )
}

export default MicroInfoProfile
