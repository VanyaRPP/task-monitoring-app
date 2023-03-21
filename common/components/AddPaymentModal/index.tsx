import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { IUser } from '@common/modules/models/User'
import { ITableData } from '@utils/tableData'
import { Form, message, Modal } from 'antd'
import React, { FC, useEffect } from 'react'
import AddPaymentForm from '../Forms/AddPaymentForm'
import s from './style.module.scss'

interface Props {
  isModalOpen: boolean
  closeModal: VoidFunction
}

type FormData = {
  payer: IUser['_id']
  credit: number
  description?: string
  maintenance?: ITableData
  placing?: ITableData
  electricity?: ITableData
  water?: ITableData
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
    const formData: FormData = await form.validateFields()
    const response = await addPayment({
      payer: formData.payer,
      credit: formData.credit,
      debit: formData.debit,
      description: formData.description,
    })
    if ('data' in response) {
      form.resetFields()
      closeModal(), message.success('Додано')
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
      {isModalOpen && (
        <AddPaymentForm form={form} edit={edit} paymentData={paymentData} />
      )}
    </Modal>
  )
}

export default AddPaymentModal
