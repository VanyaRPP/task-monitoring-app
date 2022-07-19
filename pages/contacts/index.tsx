import React from 'react'
import {
  FacebookOutlined,
  GithubOutlined,
  HomeOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { Button, Form, Input } from 'antd'
import s from './style.module.scss'

const ContactsPage: React.FC = () => {
  const onFinish = (values: any) => null

  return (
    <>
      <h1 className={s.Header}>Contact Us</h1>
      <p className={s.Text}>
        We can`t solve your problem if you don`t tell us about it!
      </p>

      <div className={s.Container}>
        <div className={s.Form}>
          <Form name="nest-messages" onFinish={onFinish}>
            <Form.Item name={['user', 'name']} rules={[{ required: true }]}>
              <Input placeholder="Name" />
            </Form.Item>

            <Form.Item name={['user', 'email']} rules={[{ type: 'email' }]}>
              <Input placeholder="Email" />
            </Form.Item>

            <Form.Item name={['user', 'introduction']}>
              <Input.TextArea placeholder="Message" />
            </Form.Item>

            <Form.Item>
              <Button block type="primary" htmlType="submit">
                Send
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className={s.Divider} />

        <div className={s.Links}>
          <div className={s.Contacts}>
            <div>
              <HomeOutlined />
              <p>Zhytomyr</p>
            </div>
            <div>
              <PhoneOutlined />
              <p>+(380)96-111-2222</p>
            </div>
            <div>
              <MailOutlined />
              <a href="#">random@gmail.com</a>
            </div>
          </div>

          <div className={s.Media}>
            <a href="#">
              <FacebookOutlined />
            </a>
            <a href="#">
              <LinkedinOutlined />
            </a>
            <a href="#">
              <InstagramOutlined />
            </a>
            <a href="#">
              <GithubOutlined />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactsPage
