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
  streetActions?: {
    edit: boolean
    preview: boolean
  }
  currentStreet?: IStreet
}

const AddStreetModal: FC<Props> = ({
  closeModal,
  streetActions,
  currentStreet,
}) => {
  const [form] = Form.useForm()
  const [addStreet, { isLoading }] = useAddStreetMutation()

  const { edit, preview } = streetActions || {}
  const handleSubmit = async () => {
    if (preview) {
      closeModal()
      return
    }
    const formData: IStreet = await form.validateFields()
    const response = await addStreet({
      city: formData.city,
      address: formData.address,
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
      onOk={handleSubmit}
      changesForm={() => form.isFieldsTouched()}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={preview ? 'Закрити' : 'Додати'}
      cancelText={preview ? '' : edit ? 'Закрити' : 'Відміна'}
      confirmLoading={isLoading}
      preview={preview}
      cancelButtonProps={preview ? { disabled: true } : {}}
    >
      {preview ? (
        <PreviewStreetForm
          form={form}
          city={currentStreet.city}
          address={currentStreet.address}
        />
      ) : (
        <AddStreetForm form={form} />
      )}
    </Modal>
  )
}

export default AddStreetModal
