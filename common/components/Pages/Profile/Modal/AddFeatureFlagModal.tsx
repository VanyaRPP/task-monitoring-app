import {
	useAddFeatureFlagMutation,
	useEditFeatureFlagMutation,
} from '@common/api/featureFlagsApi/featureFlag.api'
import { IFeatureFlag } from '@common/api/featureFlagsApi/featureFlag.api.types'
import { Form, Input, Modal, Switch, message } from 'antd'
import { FC, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: VoidFunction
  initialData?: IFeatureFlag | null
}

const FeatureFlagModal: FC<Props> = ({ open, onClose, initialData }) => {
  const [form] = Form.useForm()

  const [addFeatureFlag, { isLoading: isAdding, isSuccess }] =
    useAddFeatureFlagMutation()

  const [editFeatureFlag, { isLoading: isEditing }] =
    useEditFeatureFlagMutation()

  const isEditMode = Boolean(initialData)
  const isLoading = isAdding || isEditing

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData)
    } else {
      form.resetFields()
    }
  }, [initialData, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (isEditMode && initialData?._id) {
        const response = await editFeatureFlag({
          _id: initialData._id,
        ...values,
        })

        if ('data' in response) {
          message.success('Флаг успішно оновлено')
          onClose()
        } else {
          message.error('Помилка при оновленні флагу')
        }
      } else {
        const response = await addFeatureFlag(values)

        if ('data' in response) {
          message.success('Фічефлаг створено')
          onClose()
        } else {
          message.error('Помилка при створенні флагу')
        }
      }

      form.resetFields()
    } catch (err) {
      console.error('Form error:', err)
    }
  }

  return (
    <Modal
      title={isEditMode ? 'Редагувати фічефлаг' : 'Створити фічефлаг'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isLoading}
      okText={isEditMode ? 'Зберегти' : 'Створити'}
      cancelText="Скасувати"
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="name"
          label="Назва"
          rules={[
            { required: true, message: 'Обовʼязкове поле' },
            {
              pattern: /^[a-zA-Z0-9_]+$/,
              message: 'Тільки латинські символи та нижнє підкреслення',
            },
          ]}
        >
          <Input
            placeholder="Наприклад: showNewFeature"
            disabled={isEditMode}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Опис"
          rules={[{ required: true, message: 'Обовʼязкове поле' }]}
        >
          <Input.TextArea placeholder="Короткий опис фічефлагу" />
        </Form.Item>

        <Form.Item
          name="isEnabled"
          label="Активний"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default FeatureFlagModal
