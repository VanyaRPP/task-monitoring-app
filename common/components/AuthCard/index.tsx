import { validateField } from '@assets/features/validators'
import useLocalStorage from '@modules/hooks/useLocalStorage'
import config from '@utils/config'
import { Button, Form, FormInstance, Input } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'
import s from './index.module.scss'

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
  const router = useRouter()

  const handleSideChange = () => {
    setCardSide(!cardSide)
    setValue(!cardSide)
  }

  return (
    <div className={s.signInCard}>
      <div className={s.cardInner}>
        <Form form={form} disabled={disabled}>
          {isSignUp && (
            <Form.Item
              className={s.FormItem}
              name="name"
              required
              labelCol={{ span: 24 }}
              label={config.auth.credentialsNameLabel}
            >
              <Input
                className={s.Input}
                type="text"
                value={value.email}
                onChange={(e) => onChange(e.target)}
                placeholder={config.auth.credentialsNamePlaceholder}
              />
            </Form.Item>
          )}
          <Form.Item
            className={s.FormItem}
            name="email"
            required
            labelCol={{ span: 24 }}
            label={config.auth.credentialsEmailLabel}
            rules={validateField('email')}
            normalize={(v) => v.trim()}
          >
            <Input
              className={s.Input}
              type="text"
              value={value.email}
              onChange={(e) => onChange(e.target)}
              placeholder={config.auth.credentialsEmailPlaceholder}
            />
          </Form.Item>
          <Form.Item
            className={s.FormItem}
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
              className={s.FormItem}
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
                placeholder={config.auth.credentialsConfirmPasswordPlaceholder}
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
      </div>
    </div>
  )
}

export default AuthCard
