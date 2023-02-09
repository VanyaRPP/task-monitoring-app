import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { DatePicker, Form, Input, Modal } from 'antd'
import { Moment } from 'moment'
import { useSession } from 'next-auth/react'
import React, { FC } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  date: Moment
  debit: string
  credit: string
  description: string
}

const AddPaymentModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    form.resetFields()
    closeModal()
    // console.log(formData)
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
