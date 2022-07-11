import { getCsrfToken, getProviders, useSession } from 'next-auth/react'
import { Alert, Form, Input, Button } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import SignInBtn from '../../../components/SignInBtn'
import s from './style.module.scss'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { errors } from '../../../utils/constants'

const SignInPage = ({ providers, csrfToken }: any) => {
  const router = useRouter()
  const { status } = useSession()

  if (status === 'authenticated') {
    router.push('/')
  }

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

      <h2 className={s.Header}>Log In</h2>
      {/* <p className={s.Text}>
        Don`t have an account? <Link href="/auth/registration">Sign Up</Link>
      </p> */}

      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <form method="post" action="/api/auth/signin/email">
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

            <input type="email" id="email" name="email" />
            <button type="submit">Sign in with Email</button>
          </form>
        </div>

        {/* Karen's changes */}
        {/* <div className={s.HalfBlock}>
          <Form
            method="post"
            action="/api/auth/signin/email"
            name="normal_login"
            className={s.LoginForm}
            initialValues={{ remember: true }}
            // onFinish={() => {
            //   fetch('/api/auth/signin/email', {
            //     method: 'POST',
            //   })
            // }}
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  type: 'email',
                  message: 'Please input your email!',
                },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="email" />
            </Form.Item>

            <Form.Item>
              <Button
                block
                type="primary"
                htmlType="submit"
                className={s.FormButton}
              >
                Sign In with Email
              </Button>
            </Form.Item>
          </Form>
        </div> */}

        <div className={s.Divider} />

        <div className={s.HalfBlock}>
          {Object.values(providers).map(
            (provider: any) =>
              provider?.name !== 'Email' && (
                <SignInBtn key={provider?.name} provider={provider} />
              )
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const csrfToken = await getCsrfToken(context)
  return { props: { providers: await getProviders(), csrfToken } }
}

export default SignInPage
