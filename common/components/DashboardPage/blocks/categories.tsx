import React, { useMemo, useState } from 'react'
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

const CategoriesBlock: React.FC<{ style: string }> = ({ style }) => {
  const session = useSession()
  const router = useRouter()
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  const getCount = (name) => {
    return tasks?.filter((task) => task?.category == name)
  }
  // console.log(getCount('Vodniki1').length)

  const columns = [
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      width: '70%',
    },
    {
      title: 'Кількість',
      dataIndex: 'taskincategory',
      key: 'taskincategory',
      width: '30%',
      // render: (taskincategory) =>
      //   taskincategory !== [] ? taskincategory.length : getCount(name).length,
    },
  ]

  return (
    <Card
      className={style}
      title="Категорії"
      style={{ flex: '1.5' }}
      extra={
        <Button onClick={() => Router.push(`/category`)} ghost type="primary">
          Всі
        </Button>
      }
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
