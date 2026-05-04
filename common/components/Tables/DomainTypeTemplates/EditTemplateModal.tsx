import { useEditDomainTypeTemplateMutation } from '@common/api/domainApi/domain.api'
import {
  DomainTypeTemplateCategory,
  IDomainTypeTemplate,
} from '@common/api/domainApi/domain.api.types'
import { DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS } from '@utils/domain/domain-type-template-categories'
import { Form, Input, Modal, Select, message } from 'antd'
import React, { FC, useEffect } from 'react'

interface Props {
  open: boolean
  template: IDomainTypeTemplate | null
  onClose: () => void
}

const EditTemplateModal: FC<Props> = ({ open, template, onClose }) => {
  const [form] = Form.useForm()
  const [editTemplate, { isLoading }] = useEditDomainTypeTemplateMutation()

  useEffect(() => {
    if (template && open) {
      form.setFieldsValue({
        name: template.name,
        category: template.category,
      })
    }
  }, [template, open, form])

  const handleOk = async () => {
    if (!template) return
    const { name, category } = await form.validateFields()
    try {
      await editTemplate({
        _id: template._id,
        name: name.trim(),
        category: category as DomainTypeTemplateCategory,
      }).unwrap()
      message.success('Шаблон оновлено')
      onClose()
    } catch (e: any) {
      const msg =
        e?.status === 409
          ? 'Шаблон з такою назвою вже існує'
          : e?.data?.message || 'Не вдалося оновити шаблон'
      message.error(msg)
    }
  }

  return (
    <Modal
      open={open}
      title="Редагувати шаблон"
      okText="Зберегти"
      cancelText="Скасувати"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Назва шаблону"
          rules={[{ required: true, message: 'Введіть назву шаблону' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="category"
          label="Категорія"
          rules={[{ required: true }]}
        >
          <Select options={DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default EditTemplateModal
