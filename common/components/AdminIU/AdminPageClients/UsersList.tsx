import React, { useState } from 'react'
import { List } from 'antd'
import UserInfo from 'common/components/UserCard'
import { IUser } from 'common/modules/models/User'
import FeedbacksCard from 'common/components/FeedbacksCard'
import s from './style.module.scss'

interface Props {
  users: IUser[]
}

const Users: React.FC<Props> = ({ users }) => {
  const [user, setUser] = useState(users[0])
  const userRate = user?.rating

  if (!users || users.length === 0)
    return <h2 style={{ color: 'var(--textColor)' }}>Ще немає користувачів</h2>

  return (
    <div className={s.Container}>
      <List
        className={s.List}
        dataSource={users}
        renderItem={(item) => (
          <List.Item
            key={item._id as string}
            onClick={() => setUser(item)}
            className={`${s.ListItem} ${user._id === item._id ? s.Active : ''}`}
          >
            {item.name || item.email}
          </List.Item>
        )}
      />
      <div className={s.About}>
        <UserInfo user={user} />
        <FeedbacksCard user={user} userRate={userRate} />
      </div>
    </div>
  )
}
export default Users
