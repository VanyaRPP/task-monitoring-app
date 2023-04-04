import { useAddServiceMutation } from '@common/api/serviceApi/service.api'
import { objectWithoutKey } from '@common/assets/features/formDataHelpers'
import { IUser } from '@common/modules/models/User'
import { Form, message, Modal } from 'antd'
import { useSession } from 'next-auth/react'
import React, { FC } from 'react'
import AddServiceForm from '../Forms/AddServiceForm'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  data: Date
  orenda: number
  electricPrice: number
  waterPrice: number
  inflaPrice: number
  description: string
}

const AddServiceModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addService, { isLoading }] = useAddServiceMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    console.log(formData)

    const response = await addService({
      data: formData.data,
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
      <AddServiceForm form={form} />
    </Modal>
  )
}

export default AddServiceModal
