import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAppDispatch } from '../../../store/hooks'
import { Button, Checkbox, Form, Input } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import s from './style.module.scss'

import { useSession, signIn, signOut } from 'next-auth/react'

const LoginPage: FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const onFinish = (values: any) => {
    router.push('/')
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo)
  }

  function Component() {
    const { data: session } = useSession()
    if (session) {
      return (
        <>
          Signed in as {session?.user?.email} <br />
          <button onClick={() => signOut()}>Sign out</button>
        </>
      )
    }
    return (
      <>
        Not signed in <br />
        <button onClick={() => signIn()}>Sign in</button>
      </>
    )
  }

  return (
    <div className={s.Container}>
      <div className={s.HalfBlock}>
        <h2>Login</h2>
        <Form
          name="normal_login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Password"
            />
          </Form.Item>
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <a className="login-form-forgot" href="">
              Forgot password
            </a>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
      <div className={s.HalfBlock}>
        <h2>No account? Join us!</h2>
        <Link href="/auth/registration">
          <Button type="primary" size="large">
            Registration
          </Button>
        </Link>
        {Component()}
      </div>
    </div>
  )
}

export default LoginPage
