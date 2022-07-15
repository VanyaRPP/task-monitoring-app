import { Button, List, Skeleton } from 'antd'
import Link from 'next/link'
import {
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
} from 'common/api/categoriesApi/category.api'
import { AppRoutes } from 'utils/constants'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import DeleteButton from '../DeleteButton'

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
                  <DeleteButton
                    key="delete"
                    onDelete={() => deleteCategory(category._id)}
                  />,
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
