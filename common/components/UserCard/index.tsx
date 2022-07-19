import React from 'react'
import { Card, Button, Avatar, Image } from 'antd'
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { IUser } from 'common/modules/models/User'
import Meta from 'antd/lib/card/Meta'

import s from './style.module.scss'

interface Props {
  user: IUser
}

const UserInfo: React.FC<Props> = ({ user }) => {
  const Actions = [
    <Button key="edit" ghost type="primary">
      <EditOutlined />
    </Button>,
    <Button key="delete" ghost type="primary">
      <DeleteOutlined />
    </Button>,
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
        description={<p className={s.Description}>Email: {user.email}</p>}
      />
    </Card>
  )
}
export default UserInfo
