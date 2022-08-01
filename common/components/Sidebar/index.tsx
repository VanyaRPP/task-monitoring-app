import React from 'react'
import { Layout, Menu, Collapse, Avatar, Empty } from 'antd'
import {
  StarOutlined,
  CheckOutlined,
  SendOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import s from './style.module.scss'
import config from '../../lib/Sidebar.config'
import Filter from '../UI/FiltrationSidebar'

const { Panel } = Collapse

type MenuItem = Required<MenuProps>['items'][number]
const items: MenuItem[] = [
  {
    key: 0,
    icon: <CheckOutlined />,
    label: 'Готові замовлення', //finished orders
  },
  {
    key: 1,
    icon: <SendOutlined />,
    label: 'Активні замовлення', //active orders
  },
  {
    key: 2,
    icon: <RedoOutlined />,
    label: 'Замовлення в роботі', //in-work orders
  },
]

interface Props {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const bestMaster = config.bestMaster
const bestDomain = config.bestDomain

const Sidebar: React.FC<Props> = ({ collapsed, setCollapsed }) => {
  return (
    <Layout.Sider
      className={s.Sidebar}
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
    >
      <Menu className={s.List} mode="inline" items={items} />
      <Collapse
        bordered={false}
        className={s.Rating}
        style={{
          display: collapsed && 'none',
        }}
      >
        <Panel header="Найкращий майстер" key="1" className={s.RateBlock}>
          <div className={s.InfoBlock}>
            <span className={s.Title}>
              <Avatar size={40} src={bestMaster.avatar} />
              {bestMaster.name}
            </span>
            <span>
              {bestMaster.rate}/5
              <StarOutlined />
            </span>
          </div>
          <p>{bestMaster.about}</p>
        </Panel>

        <Panel header="Найкращий домен" key="2" className={s.RateBlock}>
          <div className={s.InfoBlock}>
            <span className={s.Title}>{bestDomain.name}</span>
            <span>
              {bestDomain.rate}/5
              <StarOutlined />
            </span>
          </div>
          <p>{bestDomain.address}</p>
        </Panel>
      </Collapse>
    </Layout.Sider>
  )
}

export default Sidebar
