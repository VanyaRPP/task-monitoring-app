import { SelectOutlined } from '@ant-design/icons'
import TableCard from '@components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import { getCount } from '@utils/helpers'
import { Button, Table } from 'antd'
import Router, { useRouter } from 'next/router'
import { FC } from 'react'
import { useGetAllCategoriesQuery } from '../../../api/categoriesApi/category.api'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import s from './style.module.scss'

const CategoriesBlock: FC = () => {
  const router = useRouter()
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  const columns = [
    {
      title: 'Назва',
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
    <TableCard
      title={
        <Button type="link" onClick={() => Router.push(AppRoutes.CATEGORY)}>
          Категорії <SelectOutlined />
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
            onClick: (event) =>
              router.push(`${AppRoutes.CATEGORY}/${record._id}`),
          }
        }}
      />
    </TableCard>
  )
}

export default CategoriesBlock
