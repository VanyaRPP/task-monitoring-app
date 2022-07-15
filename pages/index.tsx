import { useSession } from 'next-auth/react'

import DashboardPage from '../common/components/DashboardPage'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { GetServerSideProps } from 'next'
import HomePage from '../common/components/HomePage/index'

type PropsType = {
  isAuth: boolean
}

const Home: React.FC<PropsType> = ({ isAuth }) => {
  return isAuth ? <DashboardPage /> : <HomePage />
}

export default Home

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

  if (!session) {
    return {
      props: { isAuth: false },
    }
  }

  return {
    props: { isAuth: true },
  }
}
