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
import SignInForm from '../../../common/components/Forms/AddSingInForm'

type PropsType = {
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null
  csrfToken: string | undefined
}

const SignInPage: React.FC<PropsType> = ({ providers, csrfToken }) => {
  // const [form] = useForm()
  // const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  // const [credentials, setCredentials] = useState<Record<string, string>>({
  //   email: '',
  //   password: '',
  // })
  const { error } = useRouter().query
  const [customError, setCustomError] = useState('')
  // const [storedValue, setValue] = useLocalStorage('login-type', null)
  // const [cardSide, setCardSide] = useState<boolean>(storedValue)

  // const handleSideChange = () => {
  //   setCardSide(!cardSide)
  //   setValue(!cardSide)
  // }

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
  //   await signIn('credentials', { ...formData })

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

      <h2 className={s.Header}>{config.titles.signInTitle}</h2>

      {process.env.NODE_ENV === 'development' && <SignInForm />}

      {
        process.env.NODE_ENV === 'development' ? (
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
        )

        //     <div className={s.HalfBlock}>
        //       <AuthCard
        //         csrfToken={csrfToken}
        //         form={form}
        //         value={credentials}
        //         onChange={handleChange}
        //         onSubmit={handleSubmit}
        //         disabled={isFormDisabled}
        //       />
        //     </div>

        //     <div className={s.Divider} />

        //     <div className={s.HalfBlock}>
        //       <form
        //         method="post"
        //         action="/api/auth/signin/email"
        //         className={s.Form}
        //       >
        //         <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

        //         <Button className={s.Button} htmlType="submit" type="primary">
        //           <MailOutlined style={{ fontSize: '1.2rem' }} />
        //           <span onClick={handleSideChange}>Увійти з Email</span>
        //         </Button>
        //       </form>
        //       <Divider className={s.DividerOr} plain>
        //         Або
        //       </Divider>

        //     </div>
      }
    </>
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
