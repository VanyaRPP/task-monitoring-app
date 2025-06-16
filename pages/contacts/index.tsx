import {
  FacebookOutlined,
  GithubOutlined,
  HomeOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
  ContactsOutlined,
  EyeOutlined  
} from '@ant-design/icons'
import {
  deleteExtraWhitespace,
  validateField,
} from '@assets/features/validators'
import { useAddCallbackMutation } from '@common/api/callbackApi/callback.api'
import { Button, Form } from 'antd'
import s from './style.module.scss'
import { GlassCard, GlassButton, GlassInput, } from '@components/UI/GlassUI'
import React, { useState, useEffect } from 'react'
import SplashCursor from '@components/UI/SplashCursor'
import LottieAnimation from '@components/UI/LottieAnimation'
import useTheme from '@modules/hooks/useTheme'
import MainLayout from '@components/Layouts/Main'
import HomePageTitle from '@assets/svg/homePageTitle'
import { AppRoutes } from '@utils/constants'
import { LogoIcon } from '@assets/icon/Logo'
import { useRouter } from 'next/router'
import GlassIcons from '@components/UI/GlassUI/GlassIcons'

interface GlassIconsItem {
  icon: React.ReactElement
  color: string
  label: string
  href?: string
  customClass?: string
}
const items: GlassIconsItem[] = [
  { icon: <FacebookOutlined />, color: 'blue', label: 'Facebook', href: 'https://www.facebook.com/spacehub.zt/' },
  { icon: <LinkedinOutlined />, color: 'purple', label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: <InstagramOutlined />, color: 'red', label: 'Instagram', href: 'https://www.instagram.com/spacehub.zt/' },
  { icon: <GithubOutlined />, color: 'indigo', label: 'GitHub', href: 'https://github.com' },
  {
  icon: <ContactsOutlined />,
  color: 'purple',
  label: 'Контакти',
}
];


const ContactsPage: React.FC = () => {
  const [addCallback, { isLoading }] = useAddCallbackMutation()
  const [theme] = useTheme()
  const router = useRouter()
const [transparent, setTransparent] = useState(true);

  const onFinish = (values: any) => {
    addCallback(values)
  }


  return (
    <>
      <MainLayout simple>
        <div className={s.pageWrapper}>
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
          className={`${s.pageContent} ${
            theme === 'light' ? s.lightTheme : s.darkTheme
          }`}
        >

        </div>

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
              
        <GlassCard id="glassCard" className={s.feedBackCard}>
          <Button
  onClick={() => {
    const card = document.getElementById('glassCard');
    if (card) {
      card.classList.toggle(s.transparentOff);
    }
  }}
  className={s.toggleButton}
  icon={<EyeOutlined /> } 
  type="default"
>
</Button>
          <h2 className={s.Text}>Опишіть, будь ласка, вашу проблему.</h2>
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
          </div>
          
      </GlassCard>
      
 
              
        <div className={s.ContactContainer}>
          <div className={s.Links}>
            <div className={s.Contacts}>
              <div className={s.ContactAdress}>
                <HomeOutlined />
                <p className={s.ContactAdressForGoogle}>
          <a 
            href="https://www.google.com/maps?q=Мала+Бердичівська+17б,+Житомир"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              cursor: 'pointer',
              color: 'rgb(112, 92, 141)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'underline',
            }}
          >
           
           Вул. Мала Бердичівська 17б,<br /> м. Житомир
          </a>
        </p>
              </div>
              <div className={s.ContactPhone}>
                <PhoneOutlined />
                <p>+38(073)-777-5242</p>
              </div>
              <div className={s.ContactMail}>
                <MailOutlined />
                <a href="mailto:mail@spacehub.in.ua">mail@spacehub.in.ua</a>
              </div>
            </div>
            </div>
            </div>

<GlassIcons items={items} className="custom-class"/></div>
            
      </MainLayout>
      
    </>
  )
}

export default ContactsPage
