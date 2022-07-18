import { useState, useEffect } from 'react'
import { Button, List, Skeleton } from 'antd'
import Link from 'next/link'
import {
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
} from 'common/api/categoriesApi/category.api'
import { AppRoutes } from 'utils/constants'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import DeleteButton from '../UI/Buttons/DeleteButton'
import s from './style.module.scss'

interface Props {
  nameFilter: string
}

const Categories: React.FC<Props> = ({ nameFilter }) => {
  const { data: categoriesData } = useGetAllCategoriesQuery('')

  // const categories = categoriesData?.data
  const [categories, setCategories] = useState(categoriesData?.data)

  const [deleteCategory] = useDeleteCategoryMutation()

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const role = data?.data?.role

  useEffect(() => {
    setCategories(
      categoriesData?.data.filter((item) =>
        item.name.toLowerCase().includes(nameFilter.toLowerCase())
      )
    )
  }, [nameFilter, categoriesData])

  return (
    <List
      itemLayout="horizontal"
      dataSource={categories}
      renderItem={(category) => (
        <List.Item
          className={s.Category}
          actions={[
            <Button
              key="info"
              type="primary"
              onClick={() => console.log('info')}
            >
              Info
            </Button>,
          ].concat(
            role === 'Admin'
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
