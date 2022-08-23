import React, { useEffect, useMemo, useState } from 'react'
import { Card, Table, Input, Button } from 'antd'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import Router, { useRouter } from 'next/router'
import { AppRoutes, TaskStatuses } from '../../../../utils/constants'
import { useSession } from 'next-auth/react'
import {
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
} from '../../../api/categoriesApi/category.api'
import s from './style.module.scss'
import StatusTag from '../../UI/StatusTag'
import TaskInCategory from '../../../../pages/task/category/[id]'
import { getCount } from '../../../../utils/helpers'
import { SelectOutlined } from '@ant-design/icons'
import { ICategory } from 'common/modules/models/Category'
import { deleteExtraWhitespace } from 'common/assets/features/validators'

const CategoriesBlock: React.FC<{ style: string }> = ({ style }) => {
  const session = useSession()
  const router = useRouter()
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const [categories, setCategories] = useState<ICategory[]>(
    categoriesData?.data
  )

  const [search, setSearch] = useState<string>('')
  const searchInput = (order: string, placeholder: string) => (
    <Input
      placeholder={placeholder}
      value={search[order]}
      onChange={(e) => setSearch(deleteExtraWhitespace(e.target.value))}
    />
  )

  useEffect(() => {
    setCategories(
      categoriesData?.data?.filter(
        (data) =>
          data?.name?.toLowerCase().includes(search.toLowerCase()) ||
          search.toLowerCase().includes(data?.name?.toLowerCase())
      )
    )
  }, [search, categoriesData?.data])

  const columns = [
    {
      title: searchInput('name', 'Назва'),
      dataIndex: 'name',
      key: 'name',
      width: '70%',
      render: (name) => name,
    },
    {
      title: 'Кількість',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      render: (name) => getCount(tasks, name)?.length,
    },
  ]

  return (
    <Card
      className={style}
      title={
        <Button type="link" onClick={() => Router.push(AppRoutes.CATEGORY)}>
          Категорії
          <SelectOutlined className={s.Icon} />
        </Button>
      }
      style={{ flex: '1.5' }}
    >
      <Table
        className={s.Table}
        rowKey="_id"
        rowClassName={s.rowClass}
        showHeader={true}
        dataSource={categories}
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
            onClick: (event) =>
              router.push(`${AppRoutes.CATEGORY}/${record._id}`),
          }
        }}
      />
    </Card>
  )
}

export default CategoriesBlock
