import React from 'react'
import { Tabs, Card, List, Avatar } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import { AppRoutes } from '../../../utils/constants'
import config from '../../lib/dashboard.config'
import { dateToDefaultFormat } from '../features/formatDate'
import s from './style.module.scss'

const MyOrders: React.FC = () => {
  return (
    <List
      className={`${s.List} ${s.Orders}`}
      dataSource={config.myOrders}
      renderItem={(item, index) => (
        <List.Item className={s.ListItem}>
          <span style={{ marginRight: '1rem' }}>
            <span>{index + 1}.</span>
          </span>
          <div>
            <span>{item.task}</span>
            <span>{item.master}</span>
          </div>
          <div>
            <div>{dateToDefaultFormat(item.date)}</div>
            <div>{item.status}</div>
          </div>
        </List.Item>
      )}
    />
  )
}

const MastersList: React.FC = () => {
  return (
    <List
      className={`${s.List} ${s.Masters}`}
      dataSource={config.mastersList}
      renderItem={(item) => (
        <List.Item className={s.ListItem}>
          <List.Item.Meta
            avatar={<Avatar size={40} src={item.avatar} />}
            title={item.name}
            description={item.special}
          />

          <span>
            {item.rate}/5
            <StarOutlined style={{ marginLeft: '0.25rem' }} />
          </span>
        </List.Item>
      )}
    />
  )
}

const DomainLists: React.FC = () => {
  return (
    <List
      className={`${s.List} ${s.Domains}`}
      dataSource={config.domainLists}
      renderItem={(item) => (
        <List.Item className={s.ListItem}>
          <div>
            <span>{item.name}</span>
            <span>
              {item.rate}/5
              <StarOutlined style={{ marginLeft: '0.25rem' }} />
            </span>
          </div>
          <div>{item.address}</div>
        </List.Item>
      )}
    />
  )
}

const Dashboard: React.FC = () => {
  const { TabPane } = Tabs

  const dashboard = [
    <MyOrders key="My orders" />,
    <MastersList key="Masters list" />,
    <DomainLists key="Domains list" />,
  ]

  return (
    <>
      <h1 className={s.Header}>Dashboard</h1>

      <Tabs defaultActiveKey="My orders" className={s.TabList}>
        {dashboard.map((element) => (
          <TabPane tab={element.key} key={element.key}>
            {element}
          </TabPane>
        ))}
      </Tabs>

      <div className={s.TablessList}>
        {dashboard.map((element) => (
          <Card key={element.key} title={element.key} style={{ flex: '1.5' }}>
            {element}
          </Card>
        ))}
      </div>
    </>
  )
}

export default Dashboard
