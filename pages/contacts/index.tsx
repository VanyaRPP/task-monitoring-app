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
import {
  deleteExtraWhitespace,
  validateField,
} from '../../common/assets/features/validators'

const ContactsPage: React.FC = () => {
  const onFinish = (values: any) => null

  return (
    <>
      <h1 className={s.Header}>Зв`яжіться з нами</h1>
      <p className={s.Text}>
        Опишіть, будь ласка, вашу проблему, а ми допоможемо її вирішити.
      </p>

      <div className={s.Container}>
        <div className={s.Form}>
          <Form name="nest-messages" onFinish={onFinish}>
            <Form.Item
              name="name"
              normalize={deleteExtraWhitespace}
              rules={validateField('name')}
            >
              <Input maxLength={30} placeholder="Ім’я" />
            </Form.Item>

            <Form.Item name="email" rules={validateField('email')}>
              <Input placeholder="Електронна пошта" />
            </Form.Item>

            <Form.Item normalize={deleteExtraWhitespace} name="message">
              <Input.TextArea maxLength={150} placeholder="Повідомлення" />
            </Form.Item>

            <Form.Item>
              <Button block type="primary" htmlType="submit">
                Надіслати
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className={s.Divider} />

        <div className={s.Links}>
          <div className={s.Contacts}>
            <div>
              <HomeOutlined />
              <p>Житомир</p>
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
