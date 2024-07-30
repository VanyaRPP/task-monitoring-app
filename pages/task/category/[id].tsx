import { useGetCategoryByIdQuery } from '@common/api/categoriesApi/category.api'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useRouter } from 'next/router'
import { authOptions } from '../../api/auth/[...nextauth]'

const TaskInCategory = () => {
  const router = useRouter()
  const { data } = useGetCategoryByIdQuery(`${router.query.id}`, {
    skip: !router.query.id,
  })

  return <div>TaskInCategory</div>
}

export default TaskInCategory

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
