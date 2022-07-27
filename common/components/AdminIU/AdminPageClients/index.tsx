import { Tabs } from 'antd'
import { useGetAllUsersQuery } from 'common/api/userApi/user.api'
import { useState } from 'react'
import Users from './UsersList'
import s from './style.module.scss'

const { TabPane } = Tabs

const AdminPageClients: React.FC = () => {
  const [active, setActive] = useState('1')
  const { data } = useGetAllUsersQuery('')
  const allClients = data?.data

  return (
    <Tabs
      activeKey={active}
      onChange={(activeKey) => setActive(activeKey)}
      type="card"
      className={`${s.CardTabs} ${
        active === '1'
          ? s.Users
          : active === '2'
          ? s.Workers
          : active === '3'
          ? s.Premium
          : ''
      }`}
    >
      <TabPane tab="Замовники" key="1" className={s.Users}>
        {allClients && (
          <Users
            users={allClients.filter((client) => client.role === 'User')}
          />
        )}
      </TabPane>
      <TabPane tab="Майстри" key="2" className={s.Workers}>
        {allClients && (
          <Users
            users={allClients.filter((client) => client.role === 'Worker')}
          />
        )}
      </TabPane>
      <TabPane tab="Преміум" key="3" className={s.Premium}>
        {allClients && <Users users={[] /* TODO: filter users by premium */} />}
      </TabPane>
    </Tabs>
  )
}

export default AdminPageClients
