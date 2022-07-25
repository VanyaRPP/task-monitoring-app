import React, { FC } from 'react'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Image, Rate } from 'antd'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import s from './style.module.scss'

interface Props {
  _id: string | any
}

const CompetitionWorkerCard: FC<Props> = ({ _id }) => {

  const { data } = useGetUserByIdQuery(_id)
  const user = data?.data

  return (
    <div className={s.container}>
      <Card className={s.Card}>
        <Avatar
          className={s.Avatar}
          icon={<UserOutlined />}
          src={
            <Image
              src={user?.image || 'https://anime.anidub.life/templates/kinolife-blue/images/bump.png'}
              preview={false}
              style={{ width: 88 }}
              alt="UserImg"
            />
          }
        />
        <p>Name: {user?.name || user?.email}</p>
        <p>Mail: {user?.email}</p>
        <p>Phone: {user?.tel}</p>
        <Rate disabled defaultValue={user?.rating} />
      </Card>

    </div>
  )
}

export default CompetitionWorkerCard