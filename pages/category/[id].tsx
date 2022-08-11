import { data } from 'cypress/types/jquery'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import {
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
} from '../../common/api/categoriesApi/category.api'
import { useGetAllTaskQuery } from '../../common/api/taskApi/task.api'
import { ICategory } from '../../common/modules/models/Category'
import { AppRoutes } from '../../utils/constants'
import { authOptions } from '../api/auth/[...nextauth]'
import CardOneTask from '../../common/components/CardOneTask'
import { ITask } from '../../common/modules/models/Task'
import Filter from '../../common/components/UI/Filtration'

const Category: React.FC = () => {
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data
  const router = useRouter()
  const { data } = useGetCategoryByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })
  const categoryTask = data?.data

  const dataSource = useMemo(() => {
    return tasks?.filter((task) => task?.category === categoryTask?.name)
  }, [tasks, categoryTask?.name])

  return (
    <>
      <Filter tasks={dataSource} />
    </>
  )
}

export default Category

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      redirect: {
        destination: AppRoutes.AUTH_SIGN_IN,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
