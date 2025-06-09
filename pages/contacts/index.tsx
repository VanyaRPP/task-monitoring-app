import {
  FacebookOutlined,
  GithubOutlined,
  HomeOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import {
  deleteExtraWhitespace,
  validateField,
} from '@assets/features/validators'
import { useAddCallbackMutation } from '@common/api/callbackApi/callback.api'
import { Button, Form } from 'antd'
import s from './style.module.scss'
import { GlassCard, GlassButton, GlassInput } from '@components/UI/GlassUI'
import React from 'react'
import SplashCursor from '@components/UI/SplashCursor'
import LottieAnimation from '@components/UI/LottieAnimation'
import useTheme from '@modules/hooks/useTheme'
import MainLayout from '@components/Layouts/Main'
import HomePageTitle from '@assets/svg/homePageTitle'
import { AppRoutes } from '@utils/constants'
import { LogoIcon } from '@assets/icon/Logo'
import { useRouter } from 'next/router'


const ContactsPage: React.FC = () => {
  const [addCallback, { isLoading }] = useAddCallbackMutation()
const [theme] = useTheme()
const router = useRouter()
  const onFinish = (values: any) => {
    addCallback(values)
  }


  return (
    <>
<MainLayout simple>
       <div className={s.backgroundWrapper}>
        <LottieAnimation
          src="/animations/WaveForBG.json"
          loop
          style={{
            position: 'absolute',
          top: 0,
          left: 0,
          width: 'auto',
          height: '100%',
          objectFit: 'cover',
          transform: 'rotate(180deg)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 0 }}>
          <SplashCursor />
        </div>
      </div>
      
        <div
        className={`${s.pageContent} ${theme === 'light' ? s.lightTheme : s.darkTheme}`}
      ></div>
      <div className={s.Header}>
          <div className={s.Logo}>
            <LogoIcon style={{ fontSize: '100px', color: 'white' }} />
            <HomePageTitle />
          </div>
          <div className={s.Buttons}>
            <Button
              type="primary"
              onClick={() => {
                router.push(AppRoutes.AUTH_SIGN_IN)
              }}
            >
              Увійти
            </Button>
            </div>
      </div>
      <GlassCard className={s.feedBackCard}>
         <h2 className={s.Text}>
        Опишіть, будь ласка, вашу проблему, а ми допоможемо її вирішити.
      </h2>
        <div className={s.Container}>
          <div className={s.Form}>
             
            <Form name="nest-messages" onFinish={onFinish}>
              <Form.Item
                name="name"
                normalize={deleteExtraWhitespace}
                rules={validateField('name')}
              >
                 <GlassInput maxLength={30} placeholder="Ім’я" />
              </Form.Item>

              <Form.Item name="email" rules={validateField('email')}>
                 <GlassInput placeholder="Електронна пошта" />
              </Form.Item>

              <Form.Item normalize={deleteExtraWhitespace} name="message">
                 <GlassInput.TextArea maxLength={150} placeholder="Повідомлення" />
              </Form.Item>

              <Form.Item>
                <GlassButton className={s.ButtonSend}
                  block
                  type="primary"
                  htmlType="submit"
                  disabled={isLoading}
                >
                  Надіслати
                </GlassButton>
              </Form.Item>
            </Form>
          </div>

        <div className={s.Divider} />
          <div className={s.Links}>
            <div className={s.Contacts}>
              <h1 className={s.HeaderCard}>Зв`яжіться з нами</h1>
              <div className={s.ContactAdress}>
                <HomeOutlined />
                <p>Мала Бердичівська 17б, Житомир</p>
              </div>
              <div className={s.ContactPhone}>
                <PhoneOutlined />
                <p>+38(073)-777-5242</p>
              </div>
              <div className={s.ContactMail}>
                <MailOutlined />
                <a href="mail@spacehub.in.ua">mail@spacehub.in.ua</a>
              </div>
            </div>

            <div className={s.Media}>
              <a href="https://www.facebook.com/spacehub.zt/">
                <FacebookOutlined />
              </a>
              <a href="#">
                <LinkedinOutlined />
              </a>
              <a href="https://www.instagram.com/spacehub.zt/">
                <InstagramOutlined />
              </a>
              <a href="#">
                <GithubOutlined />
              </a>
            </div>
          </div>
        </div>
      </GlassCard>

      
      </MainLayout>
    </>
  )
}

export default ContactsPage
