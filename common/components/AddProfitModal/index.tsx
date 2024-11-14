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

interface Props {
  closeModal: VoidFunction
  profitActions?: {
    edit: boolean
    preview: boolean
  }
}

type FormData = {
  date: Date
  sum: number
  description: string
}

const AddProfitModal: FC<Props> = ({ closeModal, profitActions }) => {
  const [form] = Form.useForm()
  const [addProfit, { isLoading: isAddingLoading }] =
    useAddProfitPaymentMutation()
  const { edit, preview } = profitActions

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
      // const action = currentService ? 'Збережено' : 'Додано'
      // message.success(action)
    } else {
      // const action = currentService ? 'збереженні' : 'додаванні'
      // message.error(`Помилка при ${action} рахунку`)
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
      okText={'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isAddingLoading}
    >
      <AddProfitForm form={form} edit={edit} />
    </Modal>
  )
}

export default AddProfitModal
