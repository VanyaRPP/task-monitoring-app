import { useEffect } from "react"
import { getProviders, useSession } from 'next-auth/react'
import Router from 'next/router'
import { Button, Checkbox, Divider, Form, Input } from "antd"
import SinginBtn from "../../../components/SinginBtn"
import s from './style.module.sass'
import { LockOutlined, UserOutlined } from "@ant-design/icons"

const SiginPage = ({ providers }) => {

  const { data: session } = useSession()

  console.log(session);

  // useEffect(() => {
  //   async () => {
  //     // const session = await getSession()
  //     if (session) return Router.push('/')
  //   }
  //   console.log('ses', session)
  // }, [session])

  // if (session) return null;

  return (
    <div className={s.Container}>
      <div className={s.HalfBlock}>
        <div className={s.FormContainer}>
          <h2>Sing in</h2>
          {Object.values(providers).map((provider) => (
            <SinginBtn
              key={provider?.name}
              provider={provider} />
          ))}
          <Divider>or mail</Divider>
          <Form
            name="normal_login"
            className="login-form"
            initialValues={{ remember: true }}
            onFinish={() => console.log('Login vith credentals')}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your Username!' }]}
            >
              <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
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
              <Button block type="primary" htmlType="submit" className="login-form-button">
                Sing in
              </Button>
            </Form.Item>
          </Form>
        </div>

      </div>
      <div className={s.HalfBlock}>
        <h1>Hi))))</h1>
      </div>

    </div>
  )
}

export async function getServerSideProps(context) {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}

export default SiginPage
