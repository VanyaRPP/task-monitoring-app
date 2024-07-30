import SignInButton from '@components/UI/Buttons/SignInButton'
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
  // const router = useRouter()
  // const [form] = useForm()
  // const [signUp] = useSignUpMutation()
  // const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  // const [credentials, setCredentials] = useState<Record<string, string>>({
  //   name: '',
  //   email: '',
  //   password: '',
  //   confirmPassword: '',
  // })
  const { error } = useRouter().query
  const [customError, setCustomError] = useState('')

  useEffect(() => {
    setCustomError(error && (errors[`${error}`] ?? errors.default))
  }, [error])

  // const handleChange = (target) => {
  //   const { name, value } = target
  //   setCredentials({ ...credentials, [name]: value })
  // }

  // const handleSubmit = async () => {
  //   setIsFormDisabled(true)
  //   const formData = await form.validateFields()
  //   if (credentials.password !== credentials.confirmPassword) {
  //     setCustomError(config.errors.comparePasswordError)
  //   } else {
  //     const response = await signUp({
  //       name: formData.name,
  //       email: formData.email,
  //       password: formData.password,
  //     })
  //     if ((response as any)?.data?.success) {
  //       message.success('Ви успішно зареєструвалися')
  //       router.push(AppRoutes.AUTH_SIGN_IN)
  //     } else {
  //       ;(response as any)?.error?.data?.error === 'User already exists!'
  //         ? message.error('Користувач з данною поштою вже існує!')
  //         : message.error('Помилка при реєстрації!')
  //     }
  //   }

  //   form.resetFields()
  //   setIsFormDisabled(false)
  // }

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
          {Object.values(providers).map(
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
      {/* <div className={s.Container}>
        <div className={s.HalfBlock}>
          <AuthCard
            form={form}
            value={credentials}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isSignUp
            disabled={isFormDisabled}
          />
        </div>

        <div className={s.Divider} />

        <div className={s.HalfBlock}>
          {Object.values(providers).map(
            (provider: any) =>
              provider?.name !== 'Email' &&
              provider?.name !== 'Credentials' && 
              (
                <SignInButton key={provider?.name} provider={provider} />
              )
          )}
        </div>
      </div> */}
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
