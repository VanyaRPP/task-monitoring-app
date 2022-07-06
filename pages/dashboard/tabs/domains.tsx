import React from 'react'
import { List } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import s from '../style.module.scss'

interface Props {
  data: {
    id: number
    name: string
    rate: number
    address: string
  }[]
}

const Domains: React.FC<Props> = ({ data }) => (
  <List
    className={`${s.List} ${s.Domains}`}
    dataSource={data}
    renderItem={(item) => (
      <List.Item className={s.ListItem}>
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
)

export default Domains
