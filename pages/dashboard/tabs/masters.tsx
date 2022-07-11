import React from 'react'
import { List, Avatar } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import styles from '../style.module.scss'

interface Props {
  data: {
    id: number
    name: string
    avatar: React.ReactNode
    rate: number
    special: string
  }[]
}

const Masters: React.FC<Props> = ({ data }) => (
  <List
    className={`${styles.List} ${styles.Masters}`}
    dataSource={data}
    renderItem={(item) => (
      <List.Item className={styles.ListItem}>
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

export default Masters
