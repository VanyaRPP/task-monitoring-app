import { useCreateProfitMutation } from '@common/api/profitsApi/profits.api'
import AddCostForm from '@components/Forms/AddCostForm'
import Modal from '@components/UI/ModalWindow'
import type { TabsProps } from 'antd'
import { Form, Tabs, message } from 'antd'
import dayjs from 'dayjs'
import { FC, useState } from 'react'
import s from './style.module.scss'

interface Props {
  closeModal: VoidFunction
}

type FormData = {
  domain: string
  date: Date
  sum: number
  description: string
  type: string
}

const AddCostModal: FC<Props> = ({ closeModal }) => {
  const [form] = Form.useForm()
  const [type, setType] = useState<'debit' | 'credit'>('debit')
  const [createProfit, { isLoading, isError }] = useCreateProfitMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const costData = {
      domain: formData.domain,
      date: dayjs(formData.date).toISOString(),
      amount: formData.sum,
      description: formData.description || '',
      type: type as 'debit' | 'credit',
    }

    const response = await createProfit(costData)

    if ('data' in response) {
      form.resetFields()
      message.success('Успішно додано!')
      closeModal()
    }
  }

  const onTabChange = (key: string) => {
    setType(key === '1' ? 'debit' : 'credit')
  }

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: 'Додати витрати',
      children: <AddCostForm form={form} type="debit" />,
    },
    {
      key: '2',
      label: 'Додати прибутки',
      children: <AddCostForm form={form} type="credit" />,
    },
  ]

  return (
    <Modal
      title=""
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      changed={() => true}
      className={s.Modal}
      okText={'Додати'}
      cancelText={'Відміна'}
      confirmLoading={isLoading}
    >
      <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
    </Modal>
  )
}

export default AddCostModal
