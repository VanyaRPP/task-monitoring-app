import React from 'react'
import { Tabs, Card } from 'antd'

import Orders from './tabs/orders'
import Masters from './tabs/masters'
import Domains from './tabs/domains'

import s from './style.module.scss'

import config from './dashboard.config'

const { TabPane } = Tabs

const Dashboard: React.FC = () => {
  return (
    <>
      <h1>Dashboard</h1>

      <Tabs defaultActiveKey="1" className={s.TabList}>
        <TabPane tab="My orders" key="1">
          <Orders data={config.myOrders} />
        </TabPane>

        <TabPane tab="Masters list" key="2">
          <Masters data={config.mastersList} />
        </TabPane>

        <TabPane tab="Domains list" key="3">
          <Domains data={config.domainLists} />
        </TabPane>
      </Tabs>

      <div className={s.TablessList}>
        <Card title="My Orders" style={{ flex: '1.5' }}>
          <Orders data={config.myOrders} />
        </Card>
        <Card title="Masters List" style={{ flex: '1' }}>
          <Masters data={config.mastersList} />
        </Card>
        <Card title="Domain Lists" style={{ flex: '1.5' }}>
          <Domains data={config.domainLists} />
        </Card>
      </div>
    </>
  )
}

export default Dashboard
