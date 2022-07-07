import React from 'react'
import { List } from 'antd'
import styles from '../style.module.scss'

import moment from 'moment'

interface Props {
  data: {
    id: number
    task: string
    master: string
    date: Date
    status: string
  }[]
}

const Orders: React.FC<Props> = ({ data }) => (
  <List
    className={`${styles.List} ${styles.Orders}`}
    dataSource={data}
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
)

export default Orders
