import { useAddFavorMutation } from '@common/api/favorApi/favor.api'
import { objectWithoutKey } from '@common/assets/features/formDataHelpers'
import { IUser } from '@common/modules/models/User'
import { Form, message, Modal } from 'antd'
import { useSession } from 'next-auth/react'
import React, { FC } from 'react'
import AddFavorForm from '../Forms/AddFavorForm'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  orenda: number
  electricPrice: number
  waterPrice: number
  inflaPrice: number
  description: string
}

const AddFavorModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addFavor, { isLoading }] = useAddFavorMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const response = await addFavor({
      orenda: formData.orenda,
      electricPrice: formData.electricPrice,
      waterPrice: formData.waterPrice,
      inflaPrice: formData.inflaPrice,
      description: formData.description,
    })
    if ('data' in response) {
      form.resetFields()
      closeModal()
      message.success('Додано')
    } else {
      message.error('Помилка при додаванні рахунку')
    }
  }

  return (
    <Modal
      visible={isModalOpen}
      title="Ціна на послуги в місяць"
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isLoading}
    >
      <AddFavorForm form={form} />
    </Modal>
  )
}

export default AddFavorModal
