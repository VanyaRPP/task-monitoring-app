import React, { useEffect } from 'react'
import { Modal, Form, Input, Spin, message, Select } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from '@common/api/userApi/user.api'
import { IUser } from '@modules/models/User'
import {
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'

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
  const { data: allDomains, isLoading: isDomainsLoading } =
    useGetDomainFiltersQuery({})
  const { data: allCompanies, isLoading: isCompaniesLoading } =
    useGetRealEstateFiltersQuery({})

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  const getSelectValue = (item: any) => item?.value ?? item?._id ?? item
  
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        adminDomains: (user as any).adminDomains?.map(getSelectValue) ?? [],
        adminCompanies: (user as any).adminCompanies?.map(getSelectValue) ?? [],
      })
    }
  }, [user, form])

  const handleSubmit = async (values: any) => {
    if (!user?._id) return
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
            <Input
              readOnly
              suffix={
                <CopyOutlined
                  onClick={handleCopyEmail}
                  style={{ cursor: 'pointer' }}
                />
              }
            />
          </Form.Item>
          <Form.Item label="Адміністратор доменів" name="adminDomains">
            <Select
              mode="multiple"
              showSearch
              placement="bottomLeft"
              listHeight={200}
              placeholder="Виберіть домени"
              loading={isDomainsLoading}
              options={allDomains?.domainsFilter?.map((d: any) => ({
                value: d.value,
                label: d.text,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="Адміністратор Компаній" name="adminCompanies">
            <Select
              mode="multiple"
              showSearch
              placement="bottomLeft"
              listHeight={200}
              placeholder="Виберіть компанії"
              loading={isCompaniesLoading}
              options={allCompanies?.realEstatesFilter?.map((c: any) => ({
                value: c.value,
                label: c.text,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}
