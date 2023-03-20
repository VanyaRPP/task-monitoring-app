import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import { IUser } from '@common/modules/models/User'
import { ITableData } from '@utils/tableData'
import { Form, message, Modal } from 'antd'
import React, { FC } from 'react'
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

const AddPaymentModal: FC<Props> = ({ isModalOpen, closeModal }) => {
  const [form] = Form.useForm()
  const [addPayment, { isLoading }] = useAddPaymentMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    console.log(formData)

    // const response = await addPayment({
    //   payer: formData.payer,
    //   credit: formData.credit,
    //   debit: formData.debit,
    //   description: formData.description,
    // })
    // if ('data' in response) {
    //   form.resetFields()
    //   closeModal()
    //   message.success('Додано')
    // } else {
    //   message.error('Помилка при додаванні рахунку')
    // }
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
      className={s.Modal}
    >
      <AddPaymentForm form={form} />
    </Modal>
  )
}

export default AddPaymentModal
