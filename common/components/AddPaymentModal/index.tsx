import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { objectWithoutKey } from '@common/assets/features/formDataHelpers'
import { IUser } from '@common/modules/models/User'
import { Form, message, Modal } from 'antd'
import { useSession } from 'next-auth/react'
import React, { FC } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  payer: IUser['_id']
  debit: number
  credit: number
  description: string
}

const AddPaymentModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addPayment, { isLoading }] = useAddPaymentMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const response = await addPayment({
      payer: formData.payer,
      credit: formData.credit,
      debit: formData.debit,
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
      title="Додавання рахунку"
      onOk={handleSubmit}
      onCancel={closeModal}
      okText={'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isLoading}
    >
      <AddPaymentForm form={form} />
    </Modal>
  )
}

export default AddPaymentModal
