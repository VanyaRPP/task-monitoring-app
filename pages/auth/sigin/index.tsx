import { getProviders, useSession } from 'next-auth/react'
import Router, { useRouter } from 'next/router'
import { Button, Checkbox, Divider, Form, Input } from "antd"
import SinginBtn from "../../../components/SinginBtn"
import s from './style.module.scss'
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import Loading from "../../../components/Loading"
import Link from 'next/link'

const SiginPage = ({ providers }) => {

  const { data: session } = useSession()

  console.log(session);

  return (
    <>
      <h2 className={s.Header}>Log In</h2>
      <p className={s.Text}>Don't have an account? <Link href='/auth/registration'>Sign Up</Link></p>
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
              rules={[{ required: true, message: 'Please input your Username!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
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
              <Link href="/"><a className={s.FormForgot} >
                Forgot password
              </a></Link>
            </Form.Item>
            <Form.Item>
              <Button block type="primary" htmlType="submit" className={s.FormButton}>
                Sing in
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className={s.Divider} />
        <div className={s.HalfBlock}>
          {Object.values(providers).map((provider) => (
            <SinginBtn
              key={provider?.name}
              provider={provider} />
          ))}
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}

export default SiginPage
