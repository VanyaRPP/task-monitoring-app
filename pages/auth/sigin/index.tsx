import { useEffect, useState } from 'react'
import {
  ClientSafeProvider,
  getCsrfToken,
  getProviders,
  LiteralUnion,
} from 'next-auth/react'
import { Alert } from 'antd'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes, errors } from '../../../utils/constants'
import SignInButton from '../../../common/components/SignInButton'
import s from './style.module.scss'
import { BuiltInProviderType } from 'next-auth/providers'
import { authOptions } from '../../api/auth/[...nextauth]'
import { unstable_getServerSession } from 'next-auth'
import { MailOutlined } from '@ant-design/icons'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignInPage: React.FC<PropsType> = ({ providers, csrfToken }) => {
  const { error } = useRouter().query
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    setCustomError(error && (errors[`${error}`] ?? errors.default))
  }, [error])

  return (
    <>
      {error && customError !== undefined && (
        <Alert
          message="Error"
          description={customError}
          type="error"
          showIcon
          closable
        />
      )}

      <h2 className={s.Header}>Sign In</h2>

      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <form
            method="post"
            action="/api/auth/signin/email"
            className={s.Form}
          >
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <input
              className={s.Input}
              placeholder="Enter your email"
              type="email"
              id="email"
              name="email"
            />
            <button className={s.Button} type="submit">
              <MailOutlined style={{ fontSize: '1.2rem' }} />
              <span>Sign in with Email</span>
            </button>
          </form>
        </div>

        <div className={s.Divider} />

        <div className={s.HalfBlock}>
          {Object.values(providers).map(
            (provider: any) =>
              provider?.name !== 'Email' && (
                <SignInButton key={provider?.name} provider={provider} />
              )
          )}
        </div>
      </div>
    </>
  )
}

export default SignInPage

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  )

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
