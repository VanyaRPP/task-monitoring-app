import React, { useMemo, useState } from 'react'
import { Card, Table, Input, Button } from 'antd'
import {
  useGetTaskByIdQuery,
  useGetAllTaskQuery,
} from '../../../api/taskApi/task.api'
import { firstTextToUpperCase } from '../../../../utils/helpers'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../../api/userApi/user.api'
import moment from 'moment'
import Router, { useRouter } from 'next/router'
import { AppRoutes, TaskStatuses } from '../../../../utils/constants'
import { useSession } from 'next-auth/react'
import MicroInfoProfile from '../../MicroInfoProfile'
import { useGetAllCategoriesQuery } from '../../../api/categoriesApi/category.api'
import StatusTag from '../../UI/StatusTag'
import { SelectOutlined } from '@ant-design/icons'
import TableCard from '@common/components/UI/TableCard'
import s from '../style.module.scss'

const Tasks = () => {
  const session = useSession()
  const [search, setSearch] = useState({ task: '', master: '' })
  const router = useRouter()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const user = userResponse?.data?.data
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data

  const dataSource = useMemo(() => {
    return tasks?.filter((task) => task?.executant === user?._id)
  }, [tasks, user?._id])

  const filterdeDataSource = useMemo(() => {
    return dataSource?.filter(
      (data) =>
        data?.status !== TaskStatuses.ARCHIVED &&
        data?.status !== TaskStatuses.COMPLETED &&
        data?.status !== TaskStatuses.EXPIRED
    )
  }, [dataSource])
  const searchInput = (order: string) => (
    <Input
      placeholder={order.charAt(0).toUpperCase() + order.slice(1)}
      value={search[order]}
      onChange={(e) => setSearch({ ...search, [order]: e.target.value })}
    />
  )

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
        <Button
          type="link"
          onClick={() => Router.push(`${AppRoutes.TASK}/worker/${user?._id}`)}
        >
          Мої Завдання
          <SelectOutlined />
        </Button>
      }
    >
      <Table
        rowKey="_id"
        rowClassName={s.rowClass}
        showHeader={true}
        dataSource={filterdeDataSource}
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
    </TableCard>
  )
}

export default Tasks
