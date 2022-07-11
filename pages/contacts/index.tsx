import {
  FacebookOutlined,
  GithubOutlined,
  HomeOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  MinusCircleOutlined,
  PhoneOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Button, Form, Input, InputNumber, Select, Space } from 'antd'
import React from 'react'
import style from './style.module.scss'

const ContactsPage = () => {
  const onFinish = (values: any) => {
    console.log(values)
  }
  return (
    <>
      <h1 className={style.Header}>Contact Us</h1>
      <p className={style.Text}>
        We can`t solve your problem if you don`t tell us about it!
      </p>
      <div className={style.Container}>
        <div className={style.HalfBlock}>
          <div className={style.MyForm}>
            <Form name="nest-messages" onFinish={onFinish}>
              <Form.Item name={['user', 'name']} rules={[{ required: true }]}>
                <Input placeholder="*Name" />
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
        </div>
        <div className={style.Divider} />
        <div className={style.HalfBlock}>
          <div className={style.MediumBlock}>
            <div className={style.Block}>
              <HomeOutlined />
              <p>Zhytomyr</p>
            </div>
            <div className={style.Block}>
              <PhoneOutlined />
              <p>+(380)96-111-2222</p>
            </div>
            <div className={style.Block}>
              <MailOutlined />
              <p>gmail.com</p>
            </div>
            <div className={style.Links}>
              <FacebookOutlined />
              <LinkedinOutlined />
              <InstagramOutlined />
              <GithubOutlined />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactsPage
