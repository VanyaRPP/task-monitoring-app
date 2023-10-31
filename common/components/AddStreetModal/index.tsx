/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Form, message } from 'antd'
import React, { FC } from 'react'
import { IStreet } from '@common/modules/models/Street'
import { useAddStreetMutation } from '@common/api/streetApi/street.api'
import AddStreetForm from '../Forms/AddStreetForm'
import ModalWindow from '../UI/ModalWindow'

interface Props {
  closeModal: VoidFunction
  edit?: boolean
}

const AddStreetModal: FC<Props> = ({ closeModal, edit }) => {
  const [form] = Form.useForm()
  const [addStreet, { isLoading }] = useAddStreetMutation()

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
      message.error('Помилка при додаванні вулиці')
    }
  }

  return (
    <ModalWindow
      title={!edit && 'Додавання вулиці'}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={!edit && 'Додати'}
      cancelText={edit ? 'Закрити' : 'Відміна'}
      confirmLoading={isLoading}
    >
      <AddStreetForm form={form} />
    </ModalWindow>
  )
}

export default AddStreetModal
