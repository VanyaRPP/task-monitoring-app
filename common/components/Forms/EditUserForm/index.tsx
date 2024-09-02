import React, { useEffect } from 'react'
import { Form, Input, FormInstance, Spin, message } from 'antd'
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from '@common/api/userApi/user.api'
import { IUser } from '@modules/models/User'

export interface EditUserFormProps {
  form?: FormInstance
  userId?: string
  onFinish?: (user: IUser) => void
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  form: _form,
  userId,
  onFinish,
}) => {
  const [form] = Form.useForm(_form)
  const { data: user, isLoading } = useGetUserByIdQuery(userId)

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
      })
    }
  }, [user, form])

  const handleSubmit = async (values: any) => {
    try {
      const response = await updateUser({ _id: user?._id, ...values })
      if ('error' in response) {
        throw new Error((response.error as any).data.message)
      }
      message.success('Профіль успішно оновлено!')
      onFinish?.(response.data)
    } catch (error) {
      message.error(`Не вдалося оновити профіль (${error.message})`)
    }
  }

  return (
    <Spin spinning={isLoading}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Ім'я" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Пошта" name="email">
          <Input disabled />
        </Form.Item>
      </Form>
    </Spin>
  )
}
