import { useCreateProfitMutation } from '@common/api/profitsApi/profits.api'
import AddCostForm from '@components/Forms/AddCostForm'
import Modal from '@components/UI/ModalWindow'
import { useTranslation } from 'next-i18next'
import { Form, Tabs, message } from 'antd'
import type { TabsProps } from 'antd'
import { FC, useState } from 'react'
import s from './style.module.scss'
import dayjs from 'dayjs'

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

enum CostType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

const AddCostModal: FC<Props> = ({ closeModal }) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [type, setType] = useState<CostType>(CostType.DEBIT)
  const [createProfit, { isLoading, isError }] = useCreateProfitMutation()

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const costData = {
      domain: formData.domain,
      date: dayjs(formData.date).toISOString(),
      amount: formData.sum,
      description: formData.description || '',
      type: type,
    }

    const response = await createProfit(costData)

    if ('data' in response) {
      form.resetFields()
      message.success(t('modal.successMessage'))
      closeModal()
    }
  }

  const onTabChange = (key: string) => {
    setType(key === '1' ? CostType.DEBIT : CostType.CREDIT)
  }

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: t('profitPage:modal.addTitleDebit'),
      children: <AddCostForm form={form} type="debit" />,
    },
    {
      key: '2',
      label: t('profitPage:modal.addTitleCredit'),
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
      okText={t('profitPage:modal.okText')}
      cancelText={t('profitPage:modal.cancelText')}
      confirmLoading={isLoading}
    >
      <Tabs defaultActiveKey="1" items={tabItems} onChange={onTabChange} />
    </Modal>
  )
}

export default AddCostModal
