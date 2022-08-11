import { Empty, List } from 'antd'
import withAuthRedirect from '../../common/components/HOC/withAuthRedirect'
import { AppRoutes } from '../../utils/constants'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import s from './style.module.scss'
import { useGetAllCategoriesQuery } from '../../common/api/categoriesApi/category.api'

const CategoriesPage: React.FC = () => {
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  return (
    <>
      <List
        header={<div>Всі категорії</div>}
        bordered
        dataSource={categories}
        renderItem={(item) => (
          <List.Item>
            {item?.name}
            {/* <List.Item.Meta description={item?.taskincategory.length} /> */}
            <div>{item?.taskincategory.length}</div>
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
