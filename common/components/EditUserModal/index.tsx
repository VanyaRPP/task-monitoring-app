import React, { useEffect } from 'react'
import { Modal, Form, Input, Spin, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from '@common/api/userApi/user.api'
import { IUser } from '@modules/models/User'

interface EditUserModalProps {
  open: boolean
  userId?: string
  onOk: () => void
  onCancel: () => void
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  userId,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm()
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
      onOk()
    } catch (error) {
      message.error(`Не вдалося оновити профіль (${error.message})`)
    }
  }

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email)
      message.success('Пошту скопійовано!')
    }
  }

  return (
    <Modal
      open={open}
      title="Редагування профілю"
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Spin spinning={isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Ім'я" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="Пошта" name="email">
            <Input readOnly suffix={<CopyOutlined onClick={handleCopyEmail} style={{ cursor: 'pointer' }} />} />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}
