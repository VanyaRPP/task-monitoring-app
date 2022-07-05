import React, { useState } from 'react'
import { Layout, Menu, Collapse } from 'antd'
import {
  StarOutlined,
  CheckOutlined,
  SendOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import s from './style.module.scss'

const { Panel } = Collapse

type MenuItem = Required<MenuProps>['items'][number]
const items: MenuItem[] = [
  {
    key: 0,
    icon: <CheckOutlined />,
    label: 'Finished orders',
  },
  {
    key: 1,
    icon: <SendOutlined />,
    label: 'Active orders',
  },
  {
    key: 2,
    icon: <RedoOutlined />,
    label: 'In-work orders',
  },
]

const bestMaster = {
  name: 'Best master',
  avatar: null,
  rate: 4,
  about:
    'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eos, culpa.',
}

const bestDomain = {
  name: 'Best domain',
  address: 'Zhytomyr city, Mala Berdichivska street, 17',
  rate: 4,
}

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true)
  const [activeKeys, setActiveKeys] = useState([])

  return (
    <Layout.Sider
      className={s.Sidebar}
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => {
        setCollapsed(value)
        setActiveKeys([])
      }}
    >
      <Menu className={s.List} mode="inline" items={items} />

      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        bordered={false}
        className={s.Rating}
        style={{
          display: collapsed && 'none',
        }}
      >
        <Panel header="Best master" key="1" className={s.RateBlock}>
          <div className={s.InfoBlock}>
            <span className={s.Title}>
              <img className={s.Avatar} src={bestMaster.avatar} alt="" />
              {bestMaster.name}
            </span>
            <span className={s.Rate}>
              {bestMaster.rate}/5
              <StarOutlined />
            </span>
          </div>
          <p>{bestMaster.about}</p>
        </Panel>

        <Panel header="Best domain" key="2" className={s.RateBlock}>
          <div className={s.InfoBlock}>
            <span className={s.Title}>{bestDomain.name}</span>
            <span className={s.Rate}>
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
