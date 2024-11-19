import {
  useAddServiceMutation,
  useEditServiceMutation,
} from '@common/api/serviceApi/service.api'
import Modal from '@components/UI/ModalWindow'
import { Form } from 'antd'
import dayjs from 'dayjs'
import { FC, useState } from 'react'
import AddCostForm from '@components/Forms/AddCostForm'
import { useAddCostPaymentMutation } from '@common/api/paymentApi/payment.api'
import s from './style.module.scss'

interface Props {
  closeModal: VoidFunction
}

type FormData = {
  date: Date
  sum: number
  description: string
}

const AddCostModal: FC<Props> = ({ closeModal }) => {
  const [form] = Form.useForm()
  const [addCost, { isLoading: isAddingLoading }] = useAddCostPaymentMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const costData = {
      date: dayjs(formData.date).toDate(),
      sum: formData.sum,
      description: formData.description || '',
    }
    const response = await addCost(costData)

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
      <AddCostForm form={form} />
    </Modal>
  )
}

export default AddCostModal
