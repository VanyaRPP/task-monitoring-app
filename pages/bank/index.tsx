import Head from 'next/head'
import MainLayout from '@common/components/Layouts/Main'
import withAuthRedirect from '@components/HOC/withAuthRedirect'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'

import { authOptions } from '../api/auth/[...nextauth]'
import BankTransactions from '@components/Pages/BankTransactions'

export default withAuthRedirect(() => {
  return (
    <>
      <Head>
        <title>Банківські транзакції</title>
      </Head>
      <MainLayout path={[{ title: 'Bank', path: AppRoutes.BANK }]}>
        <BankTransactions />
      </MainLayout>
    </>
  )
})

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

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
