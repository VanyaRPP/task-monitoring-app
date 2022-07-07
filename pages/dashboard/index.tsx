import React from 'react'
import { Tabs, Card, Button } from 'antd'
import Router from 'next/router'
import { AppRoutes } from '../../utils/constants'
import { useSession } from 'next-auth/react'

import OrdersList from './tabs/orders'
import MastersList from './tabs/masters'
import DomainsList from './tabs/domains'

import styles from './style.module.scss'

import config from '../../lib/dashboard.config'

const { TabPane } = Tabs

const Dashboard: React.FC = () => {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className={styles.Header}>
        <h1>Dashboard is availible only for logged users</h1>
        <Button onClick={() => Router.push(AppRoutes.INDEX)}>Home</Button>
      </div>
    )
  }

  return (
    <>
      <div className={styles.Header}>
        <h1>Dashboard</h1>
        <Button onClick={() => Router.push(AppRoutes.INDEX)}>Home</Button>
      </div>

      <Tabs defaultActiveKey="1" className={styles.TabList}>
        <TabPane tab="My orders" key="1">
          <OrdersList data={config.myOrders} />
        </TabPane>

        <TabPane tab="Masters list" key="2">
          <MastersList data={config.mastersList} />
        </TabPane>

        <TabPane tab="Domains list" key="3">
          <DomainsList data={config.domainLists} />
        </TabPane>
      </Tabs>

      <div className={styles.TablessList}>
        <Card title="My Orders" style={{ flex: '1.5' }}>
          <OrdersList data={config.myOrders} />
        </Card>
        <Card title="Masters List" style={{ flex: '1' }}>
          <MastersList data={config.mastersList} />
        </Card>
        <Card title="Domain Lists" style={{ flex: '1.5' }}>
          <DomainsList data={config.domainLists} />
        </Card>
      </div>
    </>
  )
}

export default Dashboard
