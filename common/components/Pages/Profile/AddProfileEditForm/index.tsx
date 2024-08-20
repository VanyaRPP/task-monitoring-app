import React from 'react'
import { Form, Input, Button, Spin, message } from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useUpdateUserMutation } from '@common/api/userApi/user.api'

export const AddProfileEditForm = () => {
  const { data: user, isLoading } = useGetCurrentUserQuery()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    try {
      const response = await updateUser({_id:user._id, ...values})
      if ('error' in response){
        throw new Error((response.error as any).data.message)
      }
      message.success("Профіль успішно оновлено!")
    } catch (error) {
      message.error(`Не вдалося оновити профіль (${error.message})`)
    }
  }

  return (
    isLoading ? (
      <Spin tip="Завантаження даних користувача..." />
    ) : (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: user?.name,
          email: user?.email,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item label="Ім'я" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Пошта" name="email">
          <Input disabled />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isUpdating}>
            Зберегти зміни
          </Button>
        </Form.Item>
      </Form>
    )
  )
}
