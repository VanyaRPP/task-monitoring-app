import { SelectOutlined } from '@ant-design/icons'
import { TaskButton } from '@components/UI/Buttons'
import StatusTag from '@components/UI/StatusTag'
import TableCard from '@components/UI/TableCard'
import { AppRoutes, TaskStatuses } from '@utils/constants'
import { Button, Table } from 'antd'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../../api/userApi/user.api'
import s from '../style.module.scss'

const Tasks = () => {
  const session = useSession()
  const [search, setSearch] = useState({ task: '', master: '' })
  const router = useRouter()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email, {
    skip: !session?.data?.user?.email,
  })
  const user = userResponse?.data?.data
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data

  const dataSource = useMemo(() => {
    return tasks?.filter((task) => task?.executant === user?._id)
  }, [tasks, user?._id])

  const filteredDataSource = useMemo(() => {
    return dataSource?.filter(
      (data) =>
        data?.status !== TaskStatuses.ARCHIVED &&
        data?.status !== TaskStatuses.COMPLETED &&
        data?.status !== TaskStatuses.EXPIRED
    )
  }, [dataSource])
  // const searchInput = (order: string) => (
  //   <Input
  //     placeholder={order.charAt(0).toUpperCase() + order.slice(1)}
  //     value={search[order]}
  //     onChange={(e) => setSearch({ ...search, [order]: e.target.value })}
  //   />
  // )

  const columns = [
    {
      title: 'Завдання',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      ellipsis: true,
      render: (text) => text,
    },
    {
      title: 'Адреса',
      dataIndex: 'address',
      key: 'address',
      width: '20%',
      ellipsis: true,
      render: (address) => address?.name,
    },
    {
      title: 'Дата',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => Date.parse(a?.deadline) - Date.parse(b?.deadline),
      render: (date) => moment(date).format('DD-MM hh:mm'),
    },
    {
      title: 'Категорія',
      dataIndex: 'category',
      key: 'category',
      width: '20%',
      ellipsis: true,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status) => <StatusTag status={status} />,
    },
  ]

  return (
    <TableCard
      title={
        <div className={s.TasksHeader}>
          <Button
            type="link"
            onClick={() => Router.push(`${AppRoutes.TASK}/worker/${user?._id}`)}
          >
            Мої Завдання
            <SelectOutlined />
          </Button>
          <TaskButton />
        </div>
      }
    >
      <Table
        rowKey="_id"
        rowClassName={s.rowClass}
        showHeader={true}
        dataSource={filteredDataSource}
        columns={columns}
        size="small"
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
    </TableCard>
  )
}

export default Tasks
