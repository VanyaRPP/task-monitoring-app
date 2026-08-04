import { authOptions } from '../../api/auth/[...nextauth]'
import { BuiltInProviderType } from 'next-auth/providers/index'
import SignInPage from '@components/Pages/SignInPage'
import MainLayout from '@components/Layouts/Main'
import { getServerSession } from 'next-auth'
import { AppRoutes } from '@utils/constants'
import { GetServerSideProps } from 'next'
import { FC } from 'react'
import {
  ClientSafeProvider,
  getCsrfToken,
  getProviders,
  LiteralUnion,
} from 'next-auth/react'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignInDefaultPage: FC<PropsType> = ({ providers, csrfToken }) => {
  return (
    <MainLayout simple>
      <SignInPage providers={providers} csrfToken={csrfToken} />
    </MainLayout>
  )
}

export default SignInDefaultPage

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (session) {
    return {
      redirect: {
        destination: AppRoutes.INDEX,
        permanent: false,
      },
    }
  }

  const csrfToken = await getCsrfToken(context)

  return { props: { providers: await getProviders(), csrfToken } }
}
