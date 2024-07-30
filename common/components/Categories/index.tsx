import {
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
} from '@common/api/categoriesApi/category.api'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { EditButton } from '@components/UI/Buttons'
import DeleteButton from '@components/UI/Buttons/DeleteButton'
import { Roles } from '@utils/constants'
import { List, Skeleton } from 'antd'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import s from './style.module.scss'

const Categories: React.FC<{
  nameFilter: string
  handleEdit: (id: string) => void
}> = ({ nameFilter, handleEdit }) => {
  const { data: categoriesData } = useGetAllCategoriesQuery('')

  const [categories, setCategories] = useState(categoriesData?.data)

  const [deleteCategory] = useDeleteCategoryMutation()

  const { data: session } = useSession()
  const { data } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const roles = data?.data?.roles

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
          actions={
            //   [
            //   <Button
            //     className={s.Buttons}
            //     key="info"
            //     type="primary"
            //     onClick={() => ''}
            //   >
            //     Інформація
            //   </Button>,
            // ].concat(
            roles?.includes(Roles.GLOBAL_ADMIN)
              ? [
                  <DeleteButton
                    key="delete"
                    onDelete={() => deleteCategory(category._id)}
                  />,
                  <EditButton
                    key="edit"
                    onClick={() => handleEdit(category._id)}
                  />,
                ]
              : []
            // )
          }
        >
          <Skeleton title={false} loading={false} active>
            <List.Item.Meta
              title={category?.name}
              description={category?.description}
            />
          </Skeleton>
        </List.Item>
      )}
    />
  )
}

export default Categories
