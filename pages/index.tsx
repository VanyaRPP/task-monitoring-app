import Dashboard from '@common/components/Dashboard'
import HomePage from '@common/components/HomePage/index'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { Space } from 'antd'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

const Home: React.FC<{
  isAuth: boolean
}> = ({ isAuth }) => {
  if (!isAuth) {
    return <HomePage />
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Dashboard.Streets />
    </Space>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      props: { isAuth: false },
    }
  }

  return {
    props: { isAuth: true },
  }
}
