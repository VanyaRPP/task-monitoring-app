import React from 'react'
import Router from 'next/router'
import { Tabs, Card, List, Avatar, Button } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import { AppRoutes } from '../../utils/constants'
import config from '../../lib/dashboard.config'
import { dateToDefaultFormat } from '../features/formatDate'
import s from './style.module.scss'

const { TabPane } = Tabs

const Dashboard: React.FC = () => {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className={s.Header}>
        <h1>Dashboard is availible only for logged users</h1>
        <Button onClick={() => Router.push(AppRoutes.INDEX)}>Home</Button>
      </div>
    )
  }

  return (
    <>
      <div className={s.Header}>
        <h1>Dashboard</h1>
      </div>

      <Tabs defaultActiveKey="1" className={s.TabList}>
        <TabPane tab="My orders" key="1">
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
        </TabPane>

        <TabPane tab="Masters list" key="2">
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
        </TabPane>

        <TabPane tab="Domains list" key="3">
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
        </TabPane>
      </Tabs>

      <div className={s.TablessList}>
        <Card title="My Orders" style={{ flex: '1.5' }}>
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
        </Card>

        <Card title="Masters List" style={{ flex: '1' }}>
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
        </Card>

        <Card title="Domain Lists" style={{ flex: '1.5' }}>
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
        </Card>
      </div>
    </>
  )
}

export default Dashboard
