/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Form, message } from 'antd'
import React, { FC } from 'react'
import { IStreet } from '@common/modules/models/Street'
import { useAddStreetMutation } from '@common/api/streetApi/street.api'
import AddStreetForm from '../Forms/AddStreetForm'
import Modal from '../UI/ModalWindow'
import PreviewStreetForm from '../Forms/PreviewStreetForm'

interface Props {
  closeModal: VoidFunction
  currentStreet?: IStreet
  streetActions?: {
    edit: boolean
    preview: boolean
  }
}

const AddStreetModal: FC<Props> = ({
  closeModal,
  streetActions,
  currentStreet,
}) => {
  const [form] = Form.useForm()
  const [addStreet, { isLoading }] = useAddStreetMutation()
  const { edit, preview } = streetActions
  const handleSubmit = async () => {
    const formData: IStreet = await form.validateFields()
    const response = await addStreet({
      address: formData.address,
      city: formData.city,
    })
    if ('data' in response) {
      form.resetFields()
      message.success('Додано')
      closeModal()
    } else {
      message.error('Помилка при додаванні адреси')
    }
  }

  return (
    <Modal
      title={!edit && 'Додавання адреси'}
      onOk={!preview ? handleSubmit : undefined}
      changesForm={() => form.isFieldsTouched()}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={!edit && !preview ? 'Додати' : undefined}
      cancelText={preview || edit ? 'Закрити' : 'Відміна'}
      confirmLoading={isLoading}
      preview={preview}
    >
      {preview ? (
        <PreviewStreetForm form={form} currentStreet={currentStreet} />
      ) : (
        <AddStreetForm form={form} />
      )}
    </Modal>
  )
}

export default AddStreetModal
