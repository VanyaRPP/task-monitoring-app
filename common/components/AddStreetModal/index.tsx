/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Form, message } from 'antd'
import React, { FC, useEffect, useState } from 'react'
import { IStreet } from '@common/modules/models/Street'
import { useAddStreetMutation } from '@common/api/streetApi/street.api'
import AddStreetForm from '../Forms/AddStreetForm'
import Modal from '../UI/ModalWindow'

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
  const [isValueChanged, setIsValueChanged] = useState(false)
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

  const getTitle = () => {
    if (edit) return 'Редагування адреси'
    if (preview) return 'Перегляд адреси'
    return 'Додавання адреси'
  }

  useEffect(() => {
    form.setFieldsValue(currentStreet)
  }, [form, currentStreet])

  return (
    <Modal
      title={getTitle()}
      onOk={handleSubmit}
      changed={() => isValueChanged}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      cancelText="Закрити"
      okText={edit ? 'Створити' : 'Зберегти'}
      confirmLoading={isLoading}
      preview={preview}
      okButtonProps={{ style: { ...(!edit && { display: 'none' }) } }}
    >
      <AddStreetForm
        form={form}
        editable={edit}
        setIsValueChanged={setIsValueChanged}
      />
    </Modal>
  )
}

export default AddStreetModal
