import React, { FC } from 'react'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Image, Rate } from 'antd'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'
import s from './style.module.scss'

interface Props {
  _id: string | any
}

const CompetitionWorkerCard: FC<Props> = ({ _id }) => {
  const { data } = useGetUserByIdQuery(_id)
  const user = data?.data
  const desc = ['Жахливо', 'Погано', 'Нормально', 'Добре', 'Прекрасно']
  return (
    <div className={s.container}>
      <Card className={s.Card}>
        <Avatar
          className={s.Avatar}
          icon={<UserOutlined />}
          src={
            <Image
              src={
                user?.image ||
                'https://anime.anidub.life/templates/kinolife-blue/images/bump.png'
              }
              preview={false}
              style={{ width: 88 }}
              alt="UserImg"
            />
          }
        />
        <p>Ім&apos;я: {user?.name || user?.email}</p>
        <p>Електронна пошта: {user?.email}</p>
        <p>Телефон: {user?.tel}</p>
        <Rate tooltips={desc} disabled defaultValue={user?.rating} />
      </Card>
    </div>
  )
}

export default CompetitionWorkerCard
