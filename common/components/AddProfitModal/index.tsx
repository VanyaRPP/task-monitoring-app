import {
  useAddServiceMutation,
  useEditServiceMutation,
} from '@common/api/serviceApi/service.api'
import Modal from '@components/UI/ModalWindow'
import { Form } from 'antd'
import dayjs from 'dayjs'
import { FC, useState } from 'react'
import AddProfitForm from '@components/Forms/AddProfitForm'
import { useAddProfitPaymentMutation } from '@common/api/paymentApi/payment.api'
import s from './style.module.scss'

interface Props {
  closeModal: VoidFunction
}

type FormData = {
  date: Date
  sum: number
  description: string
}

const AddProfitModal: FC<Props> = ({ closeModal }) => {
  const [form] = Form.useForm()
  const [addProfit, { isLoading: isAddingLoading }] =
    useAddProfitPaymentMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const profitData = {
      date: dayjs(formData.date).toDate(),
      sum: formData.sum,
      description: formData.description || '',
    }
    const response = await addProfit(profitData)

    if ('data' in response) {
      form.resetFields()
      closeModal()
    }
  }

  return (
    <Modal
      title="Ціна на послуги в місяць"
      onOk={handleSubmit}
      changed={() => true}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      className={s.Modal}
      okText={'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isAddingLoading}
    >
      <AddProfitForm form={form} />
    </Modal>
  )
}

export default AddProfitModal
