import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { Form, message, Modal } from 'antd'
import React, { FC } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import s from './style.module.scss'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
  paymentData?: object
  edit?: boolean
}

const AddPaymentModal: FC<Props> = ({
  isModalOpen,
  closeModal,
  paymentData,
  edit,
}) => {
  const [form] = Form.useForm()
  const [addPayment, { isLoading }] = useAddPaymentMutation()
  const handleSubmit = async () => {
    const formData: IPayment = await form.validateFields()
    const response = await addPayment({
      payer: formData.payer,
      credit: formData.credit,
      description: formData.description,
      maintenance: formData.maintenance,
      placing: formData.placing,
      electricity: formData.electricity,
      water: formData.water,
      debit: formData.debit,
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
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      okText={!edit && 'Додати'}
      cancelText={edit ? 'Закрити' : 'Відміна'}
      confirmLoading={isLoading}
      className={s.Modal}
    >
      <AddPaymentForm
        form={form}
        edit={edit}
        isModalOpen={isModalOpen}
        paymentData={paymentData}
      />
    </Modal>
  )
}

export default AddPaymentModal
