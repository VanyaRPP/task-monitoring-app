import React, { useMemo, useState, useEffect } from 'react'
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
import s from '../style.module.scss'
import { useSession } from 'next-auth/react'
import MicroInfoProfile from '../../MicroInfoProfile'
import { useGetAllCategoriesQuery } from '../../../api/categoriesApi/category.api'
import StatusTag from '../../UI/StatusTag'
import { SelectOutlined } from '@ant-design/icons'
import { ICategory } from '@common/modules/models/Category'
import { deleteExtraWhitespace } from 'common/assets/features/validators'
import { ITask } from '@common/modules/models/Task'

const Tasks: React.FC<{ style: string }> = ({ style }) => {
  const session = useSession()

  const router = useRouter()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const user = userResponse?.data?.data
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data

  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

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

  const [filteredData, setFilteredData] = useState<ITask[]>(filteredDataSource)
  const [search, setSearch] = useState({ name: '', address: '' })
  const searchInput = (order: string, placeholder: string) => (
    <Input
      placeholder={placeholder}
      value={search[order]}
      onChange={(e) =>
        setSearch({ ...search, [order]: deleteExtraWhitespace(e.target.value) })
      }
    />
  )

  useEffect(() => {
    setFilteredData(
      filteredDataSource?.filter(
        (data) =>
          (search.name.toLowerCase().includes(data?.name?.toLowerCase()) ||
            data?.name?.toLowerCase().includes(search.name.toLowerCase())) &&
          (search.address
            .toLowerCase()
            .includes(data?.address?.name?.toLowerCase()) ||
            data?.address?.name
              ?.toLowerCase()
              .includes(search.address.toLowerCase()))
      )
    )
  }, [search, filteredDataSource])

  const columns = [
    {
      title: searchInput('name', 'Завдання'),
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      ellipsis: true,
      render: (text) => text,
    },
    {
      title: searchInput('address', 'Адреса'),
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
      onFilter: (value: string, record: ICategory) =>
        record.name.indexOf(value) === 0,
      filters: categories?.map((item) => {
        return {
          text: item.name,
          value: item.name,
        }
      }),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status) => <StatusTag status={status} />,
      onFilter: (value: string, record) => record.status.indexOf(value) === 0,
      filters: [
        {
          text: TaskStatuses.IN_WORK,
          value: TaskStatuses.IN_WORK,
        },
        {
          text: TaskStatuses.PENDING,
          value: TaskStatuses.PENDING,
        },
        {
          text: TaskStatuses.PENDING_SELECTION,
          value: TaskStatuses.PENDING_SELECTION,
        },
        {
          text: TaskStatuses.REJECTED,
          value: TaskStatuses.REJECTED,
        },
      ],
    },
  ]

  return (
    <Card
      className={style}
      title={
        <Button
          type="link"
          onClick={() => Router.push(`${AppRoutes.TASK}/worker/${user?._id}`)}
        >
          Мої Завдання
          <SelectOutlined className={s.Icon} />
        </Button>
      }
      style={{ flex: '1.5' }}
    >
      <Table
        rowKey="_id"
        rowClassName={s.rowClass}
        showHeader={true}
        dataSource={filteredData}
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
    </Card>
  )
}

export default Tasks
