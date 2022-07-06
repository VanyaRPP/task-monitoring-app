import React from 'react'
import { List } from 'antd'
import s from '../style.module.scss'

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
    className={`${s.List} ${s.Orders}`}
    dataSource={data}
    renderItem={(item, index) => (
      <List.Item className={s.ListItem}>
        <div>
          <span>{index + 1}.</span>
          <span>{item.task}</span>
          <span>{item.master}</span>
        </div>

        <div>
          <div>
            {item.date.getDate() +
              '.' +
              (item.date.getMonth() + 1) +
              '.' +
              item.date.getFullYear() +
              ' ' +
              (item.date.getHours() < 10 ? '0' : '') +
              item.date.getHours() +
              ':' +
              (item.date.getMinutes() < 10 ? '0' : '') +
              item.date.getMinutes()}
          </div>
          <div>{item.status}</div>
        </div>
      </List.Item>
    )}
  />
)

export default Orders
