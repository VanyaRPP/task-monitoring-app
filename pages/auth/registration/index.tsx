import { FC } from 'react'
import { useRouter } from 'next/router'
import { Button, Form, Input } from 'antd'
import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons'
import s from './style.module.scss'
import Link from 'next/link'

const RegistrationPage: FC = () => {
  const router = useRouter()

  const onFinish = (values: any) => {
    router.push('/auth/verify')
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <>
      <h2 className={s.Header}>Sign Up</h2>
      <p className={s.Text}>
        Have an account? <Link href="/auth/sigin">Log In</Link>
      </p>

      <div className={s.Container}>
        <Form
          name="normal_login"
          className={s.LoginForm}
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
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your E-Mail!' }]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              type="email"
              placeholder="E-Mail"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              style={{ width: '100%' }}
            >
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  )
}

export default RegistrationPage
