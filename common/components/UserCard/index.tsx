import { UserOutlined } from '@ant-design/icons'
import { IUser } from '@modules/models/User'
import { Avatar, Card, Image } from 'antd'
import Meta from 'antd/lib/card/Meta'
import React from 'react'

import s from './style.module.scss'

interface Props {
  user: IUser
}

const UserInfo: React.FC<Props> = ({ user }) => {
  const Actions = [
    // <Button key="edit" ghost type="primary">
    //   <EditOutlined />
    // </Button>,
    // <Button key="delete" ghost type="primary">
    //   <DeleteOutlined />
    // </Button>,
  ]
  return (
    <Card className={s.Card} actions={Actions}>
      <Meta
        className={s.Meta}
        avatar={
          <Avatar
            icon={<UserOutlined />}
            src={<Image src={user.image} alt={user.name} />}
          />
        }
        title={<h4 className={s.Title}>{user.name}</h4>}
        description={
          <p className={s.Description}>Електронна пошта: {user.email}</p>
        }
      />
    </Card>
  )
}
export default UserInfo
