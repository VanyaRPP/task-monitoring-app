import SignInButton from '@common/components/UI/Buttons/SignInButton'
import config from '@utils/config'
import { AppRoutes, errors } from '@utils/constants'
import { Alert } from 'antd'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { BuiltInProviderType } from 'next-auth/providers'
import {
  ClientSafeProvider,
  getCsrfToken,
  getProviders,
  LiteralUnion,
} from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { authOptions } from '../../api/auth/[...nextauth]'
import s from './style.module.scss'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignUpPage: React.FC<PropsType> = ({ providers, csrfToken }) => {
  const { error } = useRouter().query
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    setCustomError(error && (errors[`${error}`] ?? errors.default))
  }, [error])

  return (
    <>
      {error && customError !== undefined && (
        <Alert
          message="Помилка"
          description={customError}
          type="error"
          showIcon
          closable
        />
      )}

      <h2 className={s.Header}>{config.titles.signUpTitle}</h2>

      {process.env.NODE_ENV === 'development' ? (
        <div className={s.Container}>
          {Object.values(providers)?.map(
            (provider: any) =>
              provider?.name === 'GitHub' && (
                <SignInButton key={provider?.name} provider={provider} />
              )
          )}
        </div>
      ) : (
        <div className={s.Container}>
          {Object.values(providers).map(
            (provider: any) =>
              provider?.name === 'Google' && (
                <SignInButton key={provider?.name} provider={provider} />
              )
          )}
        </div>
      )}
    </>
  )
}

export default SignUpPage

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
