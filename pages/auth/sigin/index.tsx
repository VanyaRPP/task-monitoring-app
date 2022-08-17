import { useEffect, useState } from 'react'
import {
  ClientSafeProvider,
  getCsrfToken,
  getProviders,
  LiteralUnion,
  signIn,
} from 'next-auth/react'
import { Alert } from 'antd'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { AppRoutes, errors } from '@utils/constants'
import SignInButton from '@common/components/UI/Buttons/SignInButton'
import s from './style.module.scss'
import { BuiltInProviderType } from 'next-auth/providers'
import { authOptions } from '../../api/auth/[...nextauth]'
import { unstable_getServerSession } from 'next-auth'
import { useForm } from 'antd/lib/form/Form'
import AuthCard from '@common/components/AuthCard'
import config from '@utils/config'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignInPage: React.FC<PropsType> = ({ providers, csrfToken }) => {
  const [form] = useForm()
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [credentials, setCredentials] = useState<Record<string, string>>({
    email: '',
    password: '',
  })
  const { error } = useRouter().query
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    setCustomError(error && (errors[`${error}`] ?? errors.default))
  }, [error])

  const handleChange = (target) => {
    const { name, value } = target
    setCredentials({ ...credentials, [name]: value })
  }

  const handleSubmit = async () => {
    setIsFormDisabled(true)
    const formData = form.validateFields()
    await signIn('credentials', { ...formData })

    form.resetFields()
    setIsFormDisabled(false)
  }

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

      <h2 className={s.Header}>{config.titles.signInTitle}</h2>

      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <AuthCard
            csrfToken={csrfToken}
            form={form}
            value={credentials}
            onChange={handleChange}
            onSubmit={handleSubmit}
            disabled={isFormDisabled}
          />
        </div>

        <div className={s.Divider} />

        <div className={s.HalfBlock}>
          {Object.values(providers).map(
            (provider: any) =>
              provider?.name !== 'Email' &&
              provider?.name !== 'Credentials' && (
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
