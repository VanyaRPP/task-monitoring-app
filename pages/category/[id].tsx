import { useGetCategoryByIdQuery } from '@common/api/categoriesApi/category.api'
import { useGetAllTaskQuery } from '@common/api/taskApi/task.api'
import Filter from '@components/UI/Filtration'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { authOptions } from '../api/auth/[...nextauth]'

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
