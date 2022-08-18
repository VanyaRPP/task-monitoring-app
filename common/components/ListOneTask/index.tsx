import { List, Table } from 'antd'
import classNames from 'classnames'
import moment from 'moment'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import { ITask } from '../../modules/models/Task'
import StatusTag from '../UI/StatusTag'
import s from './style.module.scss'

interface Props {
  task: ITask[]
}

const ListOneTask: React.FC<Props> = ({ task }) => {
  const router = useRouter()

  const columns = [
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      width: '16.6%',
      ellipsis: true,
      render: (name) => name,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '16.6%',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Категорія',
      dataIndex: 'category',
      key: 'category',
      width: '16.6%',
      ellipsis: true,
      render: (category) => category,
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      width: '16.6%',
      ellipsis: true,
      render: (description) => description,
    },
    {
      title: 'Адреса',
      dataIndex: 'address',
      key: 'address',
      width: '16.6%',
      ellipsis: true,
      render: (address) => address.name,
    },
    {
      title: 'Дата',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '16.6%',
      ellipsis: true,
      sorter: (a, b) => Date.parse(a?.deadline) - Date.parse(b?.deadline),
      render: (date) => (
        <p
          className={classNames(s.Column, {
            [s.DateColumn]: moment(date).diff(moment(new Date()), 'days') <= 1,
          })}
        >
          {moment(date).format('DD-MM hh:mm')}
        </p>
      ),
    },
  ]
  return (
    <Table
      className={s.Table}
      rowKey="_id"
      rowClassName={s.rowClass}
      showHeader={true}
      dataSource={task}
      columns={columns}
      pagination={{
        responsive: false,
        size: 'small',
        pageSize: 10,
        position: ['bottomCenter'],
        hideOnSinglePage: true,
      }}
      onRow={(record, rowIndex) => {
        return {
          onClick: (event) => router.push(`${AppRoutes.TASK}/${record._id}`),
        }
      }}
    />
  )
}

export default ListOneTask
