import { Button, List, Skeleton } from 'antd'
import Link from 'next/link'
import {
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
} from '../../api/categoriesApi/category.api'
import { AppRoutes } from '../../utils/constants'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'
import { DeleteOutlined } from '@ant-design/icons'

const Categories: React.FC = () => {
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  const [deleteCategory] = useDeleteCategoryMutation()

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const role = data?.data?.role

  return (
    <List
      itemLayout="horizontal"
      dataSource={categories}
      renderItem={(category) => (
        <List.Item
          actions={[
            <Button
              key="info"
              type="primary"
              onClick={() => console.log('info')}
            >
              Info
            </Button>,
          ].concat(
            role === 'Worker'
              ? [
                  <Button
                    key="delete"
                    type="primary"
                    onClick={() => deleteCategory(category._id)}
                  >
                    <DeleteOutlined />
                  </Button>,
                ]
              : []
          )}
        >
          <Skeleton title={false} loading={false} active>
            <List.Item.Meta
              title={<Link href={AppRoutes.INDEX}>{category?.name}</Link>}
              description={category?.desription}
            />
          </Skeleton>
        </List.Item>
      )}
    />
  )
}

export default Categories
