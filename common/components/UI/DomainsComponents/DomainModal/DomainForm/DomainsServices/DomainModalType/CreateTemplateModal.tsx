import { useAddDomainTypeTemplateMutation } from '@common/api/domainApi/domain.api'
import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import { Form, Input, Modal, message } from 'antd'
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
    const { name, groupName } = await form.validateFields()
    try {
      const created = await addTemplate({
        name: name.trim(),
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
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Назва шаблону"
          rules={[{ required: true, message: 'Введіть назву шаблону' }]}
        >
          <Input placeholder="Напр. IT-послуги для розробки сайтів" />
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
