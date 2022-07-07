import { getProviders, useSession } from 'next-auth/react'
import { Button, Checkbox, Form, Input, Alert } from 'antd'
import SinginBtn from '../../../components/SinginBtn'
import s from './style.module.scss'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
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

const SiginPage = ({ providers }: any) => {
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
      {error ? (
        errrorr !== undefined || '' ? (
          <Alert
            message="Error"
            description={errrorr}
            type="error"
            showIcon
            closable
          />
        ) : null
      ) : null}
      <h2 className={s.Header}>Log In</h2>
      <p className={s.Text}>
        Don`t have an account? <Link href="/auth/registration">Sign Up</Link>
      </p>
      <div className={s.Container}>
        <div className={s.HalfBlock}>
          <Form
            name="normal_login"
            className={s.LoginForm}
            initialValues={{ remember: true }}
            onFinish={() => console.log('Login vith credentals')}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please input your Username!' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your Password!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>
            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className={s.Checkbox}>Remember me</Checkbox>
              </Form.Item>
              <Link href="/">
                <a className={s.FormForgot}>Forgot password</a>
              </Link>
            </Form.Item>
            <Form.Item>
              <Button
                block
                type="primary"
                htmlType="submit"
                className={s.FormButton}
              >
                Sing in
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className={s.Divider} />
        <div className={s.HalfBlock}>
          {Object.values(providers).map((provider: any) => (
            <SinginBtn key={provider?.name} provider={provider} />
          ))}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return { props: { providers: await getProviders() } }
}

export default SiginPage
