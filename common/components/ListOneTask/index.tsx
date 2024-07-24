import { AppRoutes } from '@utils/constants'
import { Table } from 'antd'
import { useRouter } from 'next/router'
import { ITask } from '../../modules/models/Task'
import StatusTag from '../UI/StatusTag'
import ListItemDeadline from './deadline'
import s from './style.module.scss'

interface Props {
  tasks: ITask[]
}

const ListOneTask: React.FC<Props> = ({ tasks }) => {
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
      render: (deadline) => <ListItemDeadline deadline={deadline} />,
    },
  ]
  return (
    <Table
      className={s.Table}
      rowKey="_id"
      rowClassName={s.rowClass}
      showHeader={true}
      dataSource={tasks}
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
