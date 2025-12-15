import React, { useEffect } from 'react'
import type { ObjectId } from 'mongoose'
import { Form, Input, FormInstance, Spin, message } from 'antd'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from '@common/api/userApi/user.api'
import { IUser } from '@modules/models/User'

export interface EditUserFormProps {
  form?: FormInstance
  userId?: string | ObjectId | typeof skipToken
  onFinish?: (user: IUser) => void
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  form: _form,
  userId,
  onFinish,
}) => {
  const [form] = Form.useForm(_form)

  const idForQuery: string | typeof skipToken =
    userId === skipToken || userId == null ? skipToken : String(userId)

  const {
    data: user,
    isLoading,
  } = useGetUserByIdQuery(idForQuery)

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  useEffect(() => {
    if (!user) return

    form.setFieldsValue({
      name: user.name,
      email: user.email,
    })
  }, [user, form])

  const handleSubmit = async (values: any) => {
    if (!user?._id) return
    try {
      const response = await updateUser({
        _id: user._id,
        ...values,
      }).unwrap()

      message.success('Профіль успішно оновлено!')
      onFinish?.(response)
    } catch (error: any) {
      message.error(
        `Не вдалося оновити профіль (${error?.data?.message ?? 'error'})`,
      )
    }
  }

  return (
    <Spin spinning={isLoading || isUpdating}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={!user}
      >
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
