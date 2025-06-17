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
  currentCost?: {
    domain: string
    date: Date
    sum: number
    description: string
  }
  costActions?: {
    preview: boolean
  }
}

type FormData = {
  domain: string
  date: Date
  sum: number
  description: string
  type: string
}

const AddCostModal: FC<Props> = ({ closeModal, costActions, currentCost }) => {
  const [form] = Form.useForm()
  const { preview } = costActions || {}
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
    label: preview ? 'Витрати' : 'Додати витрати',
    children: (
      <AddCostForm
        form={form}
        type="debit"
        currentCost={currentCost}
        disabled={preview}
      />
    ),
  },
  {
    key: '2',
    label: preview ? 'Прибутки' : 'Додати прибутки',
    children: (
      <AddCostForm
        form={form}
        type="credit"
        currentCost={currentCost}
        disabled={preview}
      />
    ),
  },
]

  return (
    <Modal
          title=""
          onOk={!preview ? handleSubmit : undefined}
          onCancel={() => {
            form.resetFields()
            closeModal()
          }}
          changed={() => !preview}
          className={s.Modal}
          okText={!preview ? 'Додати' : undefined}
          okButtonProps={{ style: { ...(preview && { display: 'none' }) } }}
          cancelText={preview ? 'Закрити' : 'Відміна'}
          confirmLoading={isLoading}
    >
      <Tabs
        defaultActiveKey={type === 'debit' ? '1' : '2'}
        items={tabItems}
        onChange={onTabChange}
      />

    </Modal>
  )
}

export default AddCostModal
