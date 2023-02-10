import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { Form, Modal } from 'antd'
import React, { FC } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  date: Date
  debit: string
  credit: string
  description: string
}

const AddPaymentModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addPayment] = useAddPaymentMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    await addPayment(formData)
    form.resetFields()
    closeModal()
  }

  return (
    <Modal
      visible={isModalOpen}
      title="Додавання проплати"
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={'Додати'}
      cancelText={'Відміна'}
    >
      <AddPaymentForm form={form} />
    </Modal>
  )
}

export default AddPaymentModal
