import { AppRoutes } from '@utils/constants'
import { getCount } from '@utils/helpers'
import { List } from 'antd'
import { GetServerSideProps } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { useGetAllCategoriesQuery } from '../../common/api/categoriesApi/category.api'
import { useGetAllTaskQuery } from '../../common/api/taskApi/task.api'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { authOptions } from '../api/auth/[...nextauth]'
import s from './style.module.scss'

const CategoriesPage: React.FC = () => {
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data
  const tasksResponse = useGetAllTaskQuery('')
  const tasks = tasksResponse?.data?.data

  return (
    <>
      <List
        className={s.List}
        header={<div>Всі категорії</div>}
        bordered
        dataSource={categories}
        renderItem={(item) => (
          <List.Item key={item?._id} className={s.Item}>
            <p>{item?.name}</p>
            <p>
              Загальна кількість завдань: {getCount(tasks, item?.name)?.length}
            </p>
          </List.Item>
        )}
      />
    </>
  )
}

export default withAuthRedirect(CategoriesPage)

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
