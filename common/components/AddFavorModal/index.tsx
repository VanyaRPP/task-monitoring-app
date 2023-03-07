import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
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

// type FormData = {
//   payer: IUser['_id']
//   debit: number
//   credit: number
//   description: string
// }

const AddFavorModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addPayment, { isLoading }] = useAddPaymentMutation()

  return (
    <Modal
      visible={isModalOpen}
      title="Ціна на послуги в місяць"
      // onOk={handleSubmit}
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
