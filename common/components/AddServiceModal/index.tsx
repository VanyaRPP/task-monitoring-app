import { useAddServiceMutation } from '@common/api/serviceApi/service.api'
import { objectWithoutKey } from '@common/assets/features/formDataHelpers'
import { IUser } from '@common/modules/models/User'
import { Form, message, Modal } from 'antd'
import { useSession } from 'next-auth/react'
import React, { FC } from 'react'
import AddServiceForm from '../Forms/AddServiceForm'
import moment from 'moment'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  date: Date
  address: string
  rentPrice: number
  electricityPrice: number
  waterPrice: number
  inflicionPrice: number
  description: string
}

const AddServiceModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addService, { isLoading }] = useAddServiceMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()

    const response = await addService({
      address: formData.address,
      date: moment(formData.date).toDate(),
      rentPrice: formData.rentPrice,
      electricityPrice: formData.electricityPrice,
      waterPrice: formData.waterPrice,
      inflicionPrice: formData.inflicionPrice,
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
      open={isModalOpen}
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
