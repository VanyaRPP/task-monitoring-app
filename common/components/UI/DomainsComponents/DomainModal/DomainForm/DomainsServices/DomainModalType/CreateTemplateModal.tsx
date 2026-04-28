import { useAddDomainTypeTemplateMutation } from '@common/api/domainApi/domain.api'
import {
  DomainTypeTemplateCategory,
  IDomainTypeTemplate,
} from '@common/api/domainApi/domain.api.types'
import { DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS } from '@utils/domain/domain-type-template-categories'
import { Form, Input, Modal, Select, message } from 'antd'
import React, { FC } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (created: IDomainTypeTemplate) => void
}

const CreateTemplateModal: FC<Props> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm()
  const [addTemplate, { isLoading }] = useAddDomainTypeTemplateMutation()

  const handleOk = async () => {
    const { name, groupName, category } = await form.validateFields()
    try {
      const created = await addTemplate({
        name: name.trim(),
        category: category as DomainTypeTemplateCategory,
        groups: [{ groupName: groupName.trim(), serviceIds: [] }],
      }).unwrap()
      message.success('Шаблон створено')
      form.resetFields()
      onCreated(created)
    } catch (e: any) {
      const msg =
        e?.status === 409
          ? 'Шаблон з такою назвою вже існує'
          : 'Не вдалося створити шаблон'
      message.error(msg)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Новий шаблон типу послуг"
      okText="Створити"
      cancelText="Скасувати"
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
    >
      <Form form={form} layout="vertical" initialValues={{ category: 'other' }}>
        <Form.Item
          name="name"
          label="Назва шаблону"
          rules={[{ required: true, message: 'Введіть назву шаблону' }]}
        >
          <Input placeholder="Напр. IT-послуги для розробки сайтів" />
        </Form.Item>
        <Form.Item
          name="category"
          label="Категорія"
          rules={[{ required: true }]}
        >
          <Select options={DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="groupName"
          label="Початкова група послуг"
          rules={[{ required: true, message: 'Введіть назву групи' }]}
        >
          <Input placeholder="Напр. Розробка, Підтримка" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CreateTemplateModal
