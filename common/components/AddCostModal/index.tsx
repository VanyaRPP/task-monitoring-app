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
import dayjs, { Dayjs } from 'dayjs'
import { Currency } from '@utils/constants'
import { IProfitItem, itemsForEditing } from '@utils/profit-items'
import {
  PROFIT_SCOPE_FIELD,
  scopeKeyToTarget,
} from '@components/Forms/AddCostForm/ProfitScopeSelect'
import { encodeProfitScopeKey } from '@components/Pages/ProfiitPage/hook/useProfitScopes'

/**
 * The domain or company this modal was opened for, when it was opened from
 * a scoped context (the Прибутки page). Domain and company are symmetric
 * scopes there - either can carry its own expenses - so this is exactly one
 * of the two, never a separate "which company" picker.
 */
export interface ActiveScope {
  type: 'domain' | 'company'
  id: string
  label: string
}

/**
 * A new record filled in ahead of time (by the AI assistant) for the user to
 * check and save - opens the add form, not the edit form.
 */
export interface IProfitDraft {
  type: 'debit' | 'credit'
  /**
   * The domain/company the draft names. Only a starting point: a draft's
   * target stays editable in the form, and without one the form picks the
   * scope selected on the Прибутки page.
   */
  scope?: ActiveScope | null
  /** ISO date the money moved; today when absent. */
  date?: string
  /** `YYYY-MM`; the month of `date` when absent. */
  periodMonth?: string
  currency?: string
  description?: string
  items: IProfitItem[]
}

interface Props {
  closeModal: VoidFunction
  currentProfit?: Profit
  draft?: IProfitDraft
  activeScope?: ActiveScope
  profitActions?: {
    preview?: boolean
    edit?: boolean
  }
}

type FormData = {
  domain: string
  /** Encoded scope key - set only when the form picks the target. */
  scope?: string
  date: Date
  periodMonth?: Dayjs
  description: string
  type: string
  currency?: string
  items: Partial<IProfitItem>[]
}

enum CostType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

const AddCostModal: FC<Props> = ({
  closeModal,
  currentProfit,
  draft,
  activeScope,
  profitActions,
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [type, setType] = useState<CostType>(
    (draft?.type as CostType) ?? CostType.DEBIT
  )
  const [createProfit, { isLoading }] = useCreateProfitMutation()
  const [updateProfit] = useUpdateProfitMutation()

  const isPreview = profitActions?.preview
  const isEdit = profitActions?.edit
  // A draft (from the AI assistant) is not opened from a ledger, so its
  // target is picked in the form among every domain and company.
  const picksScope = !!draft && !activeScope

  const handleSubmit = async () => {
    let formData: FormData
    try {
      formData = await form.validateFields()
    } catch {
      // The form already shows what is missing next to each field.
      return
    }
    const costData = {
      // With an active scope, the target is implied by which ledger the
      // modal was opened from - not something to re-derive from the form.
      ...(activeScope
        ? { [activeScope.type]: activeScope.id }
        : picksScope
          ? scopeKeyToTarget(formData.scope)
          : { domain: formData.domain }),
      date: dayjs(formData.date).toISOString(),
      description: formData.description || '',
      type: type,
      // The API derives amount and categories from the lines.
      items: (formData.items ?? []).map(
        ({ category, amount, description }) => ({
          category: category?.trim() || undefined,
          amount: Number(amount),
          description: description?.trim() || undefined,
        })
      ),
      // Default to the month of the payment date, which is right for most
      // costs; the picker is there for the ones it is not.
      periodMonth: dayjs(formData.periodMonth ?? formData.date).format(
        'YYYY-MM'
      ),
      currency: formData.currency || Currency.UAH,
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
          activeScope={activeScope}
          pickScope={picksScope}
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
          activeScope={activeScope}
          pickScope={picksScope}
        />
      ),
    },
  ]

  useEffect(() => {
    if (currentProfit) {
      form.setFieldsValue({
        domain: currentProfit.domain,
        date: dayjs(currentProfit.date),
        periodMonth: currentProfit.periodMonth
          ? dayjs(currentProfit.periodMonth)
          : dayjs(currentProfit.date),
        currency: currentProfit.currency || Currency.UAH,
        // Only the preview of an older record shows `sum` on its own.
        sum: currentProfit.amount,
        description: currentProfit.description,
        items: itemsForEditing(currentProfit),
      })
      setType(currentProfit.type as CostType)
    } else if (draft) {
      form.setFieldsValue({
        ...(picksScope && draft.scope
          ? {
              [PROFIT_SCOPE_FIELD]: encodeProfitScopeKey(
                draft.scope.type,
                draft.scope.id
              ),
            }
          : {}),
        date: draft.date ? dayjs(draft.date) : dayjs(),
        periodMonth: draft.periodMonth ? dayjs(draft.periodMonth) : undefined,
        currency: draft.currency || Currency.UAH,
        description: draft.description,
        items: draft.items,
      })
      setType(draft.type as CostType)
    } else {
      form.setFieldsValue({
        // No `domain` field to fill when scoped - see handleSubmit, which
        // reads the target from activeScope directly instead of the form.
        ...(activeScope ? {} : { domain: undefined }),
        date: dayjs(),
        currency: Currency.UAH,
        items: [{}],
      })
    }
  }, [currentProfit, draft, form, activeScope, picksScope])

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
          activeScope={activeScope}
          pickScope={picksScope}
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
