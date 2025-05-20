import SignInButton from '@common/components/UI/Buttons/SignInButton'
import config from '@utils/config'
import { AppRoutes, errors } from '@utils/constants'
import { Alert, Card } from 'antd'
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
import SignInForm from '../../../common/components/Forms/AddSingInForm'
import { useFeatureFlag } from '@modules/hooks/useFeatureFlag'


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
  const [theme, setTheme] = useState('light')

  const enabledLoginFormFeather = useFeatureFlag('StagingLogInForm')

  const stg = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const shouldShowLoginForm =
    process.env.NODE_ENV === 'development' || enabledLoginFormFeather

  useEffect(() => {
    setCustomError(error && (errors[`${error}`] ?? errors.default))
  }, [error])

  // Динамічно отримуємо поточну тему з localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
  }, [])

  return (
    <div
      className={`login-container ${theme}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <div>
        {error && customError !== undefined && (
          <Alert
            message="Помилка"
            description={customError}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 20 }}
          />
        )}

        <h2
          className={s.Header}
          style={{
            color: theme === 'dark' ? '#fff' : '#000',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {config.titles.signInTitle}
        </h2>

        <Card className={`card ${theme}`}>
          {shouldShowLoginForm && <SignInForm csrfToken={csrfToken} />}
          {stg && <SignInForm csrfToken={csrfToken} />}
          <div className={s.Container}>
            {Object.values(providers)?.map((provider: any) => {
              const name = provider?.name
              if (
                (process.env.NODE_ENV === 'development' && name === 'GitHub') ||
                (process.env.NODE_ENV !== 'development' && name === 'Google')
              ) {
                return <SignInButton key={name} provider={provider} />
              }
              return null
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SignInPage

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
