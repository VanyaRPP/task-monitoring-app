import MailOutlined from '@ant-design/icons/lib/icons/MailOutlined'
import LoginOutlined from '@ant-design/icons/lib/icons/LoginOutlined'
import { Button, Form, FormInstance, Input } from 'antd'
import config from '@utils/config'
import s from './index.module.scss'
import { useState } from 'react'
import useLocalStorage from '@common/modules/hooks/useLocalStorage'
import { validateField } from '@common/assets/features/validators'

const AuthCard = ({
  disabled,
  isSignUp = false,
  csrfToken,
  onSubmit,
  onChange,
  value,
  form,
}: {
  disabled: boolean
  isSignUp?: boolean
  csrfToken?: string
  onSubmit: () => void
  onChange: (arg: EventTarget) => void
  value: any
  form: FormInstance<any>
}) => {
  const [storedValue, setValue] = useLocalStorage('login-type', null)
  const [cardSide, setCardSide] = useState<boolean>(storedValue)

  const handleSideChange = () => {
    setCardSide(!cardSide)
    setValue(!cardSide)
  }

  return (
    <div className={s.signInCard}>
      {!isSignUp && (
        <div className={s.cardHeader}>
          <div onClick={handleSideChange}>
            {storedValue
              ? config.auth.credentialsTypeLabel
              : config.auth.magicLinkTypeLabel}
          </div>
          <LoginOutlined />
        </div>
      )}
      <div className={s.cardInner}>
        {!isSignUp && cardSide ? (
          <form
            method="post"
            action="/api/auth/signin/email"
            className={s.Form}
          >
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <input
              className={s.Input}
              placeholder="Введіть електронну пошту"
              type="email"
              id="email"
              name="email"
            />
            <Button className={s.Button} htmlType="submit" type="primary">
              <MailOutlined style={{ fontSize: '1.2rem' }} />
              <span>Увійти з Email</span>
            </Button>
          </form>
        ) : (
          <Form form={form} disabled={disabled}>
            {isSignUp && (
              <Form.Item
                name="name"
                required
                labelCol={{ span: 24 }}
                label={config.auth.credentialsNameLabel}
              >
                <Input
                  type="text"
                  value={value.email}
                  onChange={(e) => onChange(e.target)}
                  placeholder={config.auth.credentialsNamePlaceholder}
                />
              </Form.Item>
            )}
            <Form.Item
              name="email"
              required
              labelCol={{ span: 24 }}
              label={config.auth.credentialsEmailLabel}
              rules={validateField('email')}
              normalize={(v) => v.trim()}
            >
              <Input
                type="text"
                value={value.email}
                onChange={(e) => onChange(e.target)}
                placeholder={config.auth.credentialsEmailPlaceholder}
              />
            </Form.Item>
            <Form.Item
              name="password"
              required
              labelCol={{ span: 24 }}
              label={config.auth.credentialsPasswordLabel}
              rules={validateField('password')}
              normalize={(v) => v.trim()}
            >
              <Input
                type="password"
                value={value.password}
                onChange={(e) => onChange(e.target)}
                placeholder={config.auth.credentialsPasswordPlaceholder}
              />
            </Form.Item>
            {isSignUp && (
              <Form.Item
                name="confirmPassword"
                required
                labelCol={{ span: 24 }}
                dependencies={['password']}
                label={config.auth.credentialsConfirmPasswordLabel}
                rules={[
                  {
                    required: true,
                    min: 8,
                    message: 'Пароль має складатися з 8 символів!',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Паролі не співпадають!'))
                    },
                  }),
                ]}
                normalize={(v) => v.trim()}
              >
                <Input
                  type="password"
                  value={value.confirmPassword}
                  onChange={(e) => onChange(e.target)}
                  placeholder={
                    config.auth.credentialsConfirmPasswordPlaceholder
                  }
                />
              </Form.Item>
            )}
            <div>
              <Form.Item shouldUpdate>
                {() => (
                  <Button
                    onClick={() => onSubmit()}
                    className={s.signInCardSubmitBtn}
                    htmlType="submit"
                    type="primary"
                    disabled={
                      !form.isFieldsTouched(true) ||
                      !!form
                        .getFieldsError()
                        .filter(({ errors }) => errors.length).length
                    }
                  >
                    {config.auth.credentialsButtonLabel}
                  </Button>
                )}
              </Form.Item>
            </div>
          </Form>
        )}
      </div>
    </div>
  )
}

export default AuthCard
