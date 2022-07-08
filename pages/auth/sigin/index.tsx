import { getCsrfToken, getProviders, useSession } from 'next-auth/react'
import { Alert, Form, Input, Button } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import SinginBtn from '../../../components/SinginBtn'
import s from './style.module.scss'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface errors {
  [index: string]: string
}

const errors: errors = {
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Try signing in with a different account.',
  OAuthCallback: 'Try signing in with a different account.',
  OAuthCreateAccount: 'Try signing in with a different account.',
  EmailCreateAccount: 'Try signing in with a different account.',
  Callback: 'Try signing in with a different account.',
  OAuthAccountNotLinked:
    'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'The e-mail could not be sent.',
  CredentialsSignin:
    'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
  default: 'Unable to sign in.',
}

const SiginPage = ({ providers, csrfToken }: any) => {
  const router = useRouter()
  const { status } = useSession()

  if (status === 'authenticated') {
    router.push('/')
  }

  const { error } = useRouter().query
  const [errrorr, setErrrorr] = useState('')

  useEffect(() => {
    setErrrorr(error && (errors[`${error}`] ?? errors.default))
  }, [error])

  return (
    <>
      {error && errrorr !== undefined && (
        <Alert
          message="Error"
          description={errrorr}
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
          {Object.values(providers).map((provider: any) =>
            provider?.name !== 'Email' ? (
              <SinginBtn key={provider?.name} provider={provider} />
            ) : null
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

export default SiginPage
