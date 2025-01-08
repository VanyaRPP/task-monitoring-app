/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { FC, useEffect, useState } from 'react'
import { useAddStreetMutation, useEditStreetMutation } from '@common/api/streetApi/street.api'
import Modal from '@components/UI/ModalWindow'
import { IStreet } from '@modules/models/Street'
import { Form, message } from 'antd'

import AddStreetForm from '../Forms/AddStreetForm'

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
  const [editStreet, { isLoading: editLoading }] = useEditStreetMutation()
  const { edit, preview } = streetActions || {}
  const handleSubmit = async () => {
    if (preview) {
      closeModal()
      return
    }

    const formData: IStreet = await form.validateFields()

    if (edit && currentStreet) {
      // Редагування адреси
      const response = await editStreet({ _id: currentStreet._id, ...formData })
      if ('data' in response) {
        message.success('Адресу успішно оновлено')
        closeModal()
      } else {
        message.error('Помилка при оновленні адреси')
      }
    } else {
      // Додавання нової адреси
      const response = await addStreet({
        city: formData.city,
        address: formData.address,
      })
      if ('data' in response) {
        form.resetFields()
        message.success('Адресу додано')
        closeModal()
      } else {
        message.error('Помилка при додаванні адреси')
      }
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
      okText={edit ? 'Зберегти' : 'Додати'}
      confirmLoading={isLoading || editLoading}
      preview={preview}
    >
      <AddStreetForm
        form={form}
        editable={!preview}
        setIsValueChanged={setIsValueChanged}
      />
    </Modal>
  )
}

export default AddStreetModal
