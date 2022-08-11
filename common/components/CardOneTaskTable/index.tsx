import { Table } from 'antd'
import moment from 'moment'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import { ITask } from '../../modules/models/Task'
import StatusTag from '../UI/StatusTag'
import s from './style.module.scss'

interface Props {
  task: ITask
}

const CardOneTaskTable: React.FC<Props> = ({ task }) => {
  const router = useRouter()
  const columns = [
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      width: '16.6%',
      ellipsis: true,
      render: (text) => task.name,
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
      render: (category) => task.category,
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      width: '16.6%',
      ellipsis: true,
      render: (description) => task.description,
    },
    {
      title: 'Адреса',
      dataIndex: 'address',
      key: 'address',
      width: '16.6%',
      ellipsis: true,
      render: (address) => task.address.name,
    },
    {
      title: 'Дата',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '16.6%',
      ellipsis: true,
      sorter: (a, b) => Date.parse(a?.deadline) - Date.parse(b?.deadline),
      render: (date) => moment(date).format('DD-MM hh:mm'),
    },
  ]
  return (
    <Table
      rowKey="_id"
      rowClassName={s.rowClass}
      showHeader={true}
      columns={columns}
      pagination={{
        responsive: false,
        size: 'small',
        pageSize: 5,
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

export default CardOneTaskTable
