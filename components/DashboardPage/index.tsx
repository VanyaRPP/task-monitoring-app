import React from 'react'
import { Tabs, Card, Button, List, Avatar } from 'antd'
import styles from './style.module.scss'
import config from '../../lib/dashboard.config'
import { StarOutlined } from '@ant-design/icons'
import moment from 'moment'
import { dateToDefaultFormat } from '../features/formatDate'

const { TabPane } = Tabs

const Dashboard: React.FC = () => {
  return (
    <>
      <h1>Dashboard</h1>
      <Tabs defaultActiveKey="1" className={styles.TabList}>
        <TabPane tab="My orders" key="1">
          <List
            className={`${styles.List} ${styles.Orders}`}
            dataSource={config.myOrders}
            renderItem={(item, index) => (
              <List.Item className={styles.ListItem}>
                <div>
                  <span>{index + 1}.</span>
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
            className={`${styles.List} ${styles.Masters}`}
            dataSource={config.mastersList}
            renderItem={(item) => (
              <List.Item className={styles.ListItem}>
                <List.Item.Meta
                  avatar={<Avatar size={40} src={item.avatar} />}
                  title={item.name}
                  description={item.special}
                />

                <div style={{ gap: '0.5rem' }}>
                  {item.rate}/5
                  <StarOutlined style={{ fontSize: '20px' }} />
                </div>
              </List.Item>
            )}
          />
        </TabPane>

        <TabPane tab="Domains list" key="3">
          <List
            className={`${styles.List} ${styles.Domains}`}
            dataSource={config.domainLists}
            renderItem={(item) => (
              <List.Item className={styles.ListItem}>
                <div>
                  <span>{item.name}</span>
                  <span style={{ gap: '0.5rem', display: 'flex' }}>
                    {item.rate}/5
                    <StarOutlined style={{ fontSize: '20px' }} />
                  </span>
                </div>
                <div>{item.address}</div>
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>

      <div className={styles.TablessList}>
        <Card title="My Orders" style={{ flex: '1.5' }}>
          <List
            className={`${styles.List} ${styles.Orders}`}
            dataSource={config.myOrders}
            renderItem={(item, index) => (
              <List.Item className={styles.ListItem}>
                <div>
                  <span>{index + 1}.</span>
                  <span>{item.task}</span>
                  <span>{item.master}</span>
                </div>

                <div>
                  <div>{moment(item.date).format('DD.MM.yyyy hh:mm')}</div>
                  <div>{item.status}</div>
                </div>
              </List.Item>
            )}
          />
        </Card>
        <Card title="Masters List" style={{ flex: '1' }}>
          <List
            className={`${styles.List} ${styles.Masters}`}
            dataSource={config.mastersList}
            renderItem={(item) => (
              <List.Item className={styles.ListItem}>
                <List.Item.Meta
                  avatar={<Avatar size={40} src={item.avatar} />}
                  title={item.name}
                  description={item.special}
                />

                <div style={{ gap: '0.5rem' }}>
                  {item.rate}/5
                  <StarOutlined style={{ fontSize: '20px' }} />
                </div>
              </List.Item>
            )}
          />
        </Card>
        <Card title="Domain Lists" style={{ flex: '1.5' }}>
          <List
            className={`${styles.List} ${styles.Domains}`}
            dataSource={config.domainLists}
            renderItem={(item) => (
              <List.Item className={styles.ListItem}>
                <div>
                  <span>{item.name}</span>
                  <span style={{ gap: '0.5rem', display: 'flex' }}>
                    {item.rate}/5
                    <StarOutlined style={{ fontSize: '20px' }} />
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
