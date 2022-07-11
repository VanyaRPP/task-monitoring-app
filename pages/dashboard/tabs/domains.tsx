import React from 'react'
import { List } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import styles from '../style.module.scss'

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
    className={`${styles.List} ${styles.Domains}`}
    dataSource={data}
    renderItem={(item) => (
      <List.Item className={styles.ListItem}>
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

export default Domains
