import {
  useCreateProfitMutation,
  useUpdateProfitMutation,
} from '@common/api/profitsApi/profits.api'
import { Profit } from '@common/api/profitsApi/profits.type'
import AddCostForm from '@components/Forms/AddCostForm'
import Modal from '@components/UI/ModalWindow'
import { useTranslation } from 'next-i18next'
import { Form, Tabs, message } from 'antd'
import type { TabsProps } from 'antd'
import { FC, useState, useEffect } from 'react'
import s from './style.module.scss'
import dayjs from 'dayjs'

interface Props {
  closeModal: VoidFunction
  currentProfit?: Profit
  activeDomain?: string
  profitActions?: {
    preview?: boolean
    edit?: boolean
  }
}

type FormData = {
  domain: string
  date: Date
  sum: number
  description: string
  type: string
  categories: string[]
}

enum CostType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

const AddCostModal: FC<Props> = ({
  closeModal,
  currentProfit,
  activeDomain,
  profitActions,
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [type, setType] = useState<CostType>(CostType.DEBIT)
  const [createProfit, { isLoading }] = useCreateProfitMutation()
  const [updateProfit] = useUpdateProfitMutation()

  const isPreview = profitActions?.preview
  const isEdit = profitActions?.edit

  const handleSubmit = async () => {
    const formData: FormData = await form.validateFields()
    const costData = {
      domain: formData.domain,
      date: dayjs(formData.date).toISOString(),
      amount: formData.sum,
      description: formData.description || '',
      type: type,
      categories: formData.categories || [],
    }

    let response
    if (isEdit && currentProfit?._id) {
      response = await updateProfit({ id: currentProfit._id, body: costData })
    } else {
      response = await createProfit(costData)
    }

    if ('data' in response) {
      form.resetFields()
      message.success(
        isEdit
          ? t('profitPage:modal.editSuccess')
          : t('profitPage:modal.successMessage')
      )
      closeModal()
    } else {
      message.error(t('profitPage:modal.errorMessage'))
    }
  }

  const onTabChange = (key: string) => {
    setType(key === '1' ? CostType.DEBIT : CostType.CREDIT)
  }

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: t('profitPage:modal.addTitleDebit'),
      children: (
        <AddCostForm
          form={form}
          type="debit"
          disabled={isPreview}
          currentProfit={currentProfit}
        />
      ),
    },
    {
      key: '2',
      label: t('profitPage:modal.addTitleCredit'),
      children: (
        <AddCostForm
          form={form}
          type="credit"
          disabled={isPreview}
          currentProfit={currentProfit}
        />
      ),
    },
  ]

  useEffect(() => {
    if (currentProfit) {
      form.setFieldsValue({
        domain: currentProfit.domain,
        date: dayjs(currentProfit.date),
        sum: currentProfit.amount,
        description: currentProfit.description,
        categories: currentProfit.categories || [],
      })
      setType(currentProfit.type as CostType)
    } else {
      form.setFieldsValue({
        domain: activeDomain,
        date: dayjs(),
      })
    }
  }, [currentProfit, form, activeDomain])

  return (
    <Modal
      title={
        isPreview
          ? t('profitPage:modal.previewTitle')
          : isEdit
            ? t('profitPage:modal.editTitle')
            : t('profitPage:modal.addTitle')
      }
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields()
        closeModal()
      }}
      changed={() => !isPreview}
      className={s.Modal}
      okText={
        isPreview
          ? undefined
          : isEdit
            ? t('profitPage:modal.editOkText')
            : t('profitPage:modal.okText')
      }
      cancelText={
        isPreview
          ? t('profitPage:modal.closeText')
          : t('profitPage:modal.cancelText')
      }
      okButtonProps={{ style: { ...(isPreview && { display: 'none' }) } }}
      confirmLoading={isLoading}
    >
      {isPreview || isEdit ? (
        <AddCostForm
          form={form}
          type={type}
          disabled={isPreview}
          currentProfit={currentProfit}
        />
      ) : (
        <Tabs
          activeKey={type === 'debit' ? '1' : '2'}
          items={tabItems}
          onChange={onTabChange}
        />
      )}
    </Modal>
  )
}

export default AddCostModal
