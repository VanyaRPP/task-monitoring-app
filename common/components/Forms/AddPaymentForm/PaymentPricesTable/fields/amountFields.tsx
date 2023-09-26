import { usePreviousMonthService } from '@common/modules/hooks/useService'
import StyledTooltip from '@common/components/UI/Reusable/StyledTooltip'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useCompanyInvoice } from '@common/modules/hooks/usePayment'
import { validateField } from '@common/assets/features/validators'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { NamePath } from 'antd/lib/form/interface'
import { ServiceType } from '@utils/constants'
import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import s from '../style.module.scss'

export function AmountPlacingField({ record, preview, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: preview })
  const inflicion = paymentData?.invoice.find(
    (i) => i.type === ServiceType.Inflicion
  )
  return company?.inflicion || inflicion ? (
    <AmountPlacingInflicionField preview={preview} record={record} edit={edit} />
  ) : (
    <AmountTotalAreaField record={record} preview={preview} edit={edit} />
  )
}

export function AmountTotalAreaField({ record, preview, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'amount']
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: preview })

  // previe mode for first page where u add a payment after use mykolas fixed and get previous values
  useEffect(() => {
    if (company?._id && company?.totalArea && !edit) {
      form.setFieldValue(fieldName, company.totalArea)
    }
  }, [company?._id, company?.totalArea]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={!edit && validateField('required')}>
      <InputNumber disabled className={s.input} />
    </Form.Item>
  )
}

function AmountPlacingInflicionField({ record, preview, edit }) {
  const { previousPlacingPrice, inflicionPrice } = useInflicionValues({
    preview,
  })
  const fieldName = [record.name, 'placingPrice']
  const { form } = usePaymentContext()
  
  if (!edit) {
    form.setFieldValue(
      fieldName,
      preview
        ? `${record?.placingPrice}`
        : `${previousPlacingPrice}+${inflicionPrice}`
    ) //view && add
  } 

  return (
    <div className={s.question_mark}>
      <Form.Item name={fieldName} rules={validateField('required')}>
        <InputNumber disabled className={s.input} />
      </Form.Item>
      <StyledTooltip
        title={`Значення попереднього місяця + індекс інфляції в цьому рахунку`}
      />
    </div>
  )
}


export function AmountGarbageCollectorField({ preview }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { company } = useCompany({ companyId, skip: preview })
  const { service } = useService({ serviceId, skip: preview })
  if (service?.garbageCollectorPrice && company.rentPart) {
    return `${company.rentPart}% від ${service?.garbageCollectorPrice}`
  }
}

// TODO: Could it be helper from @util ?
// PaymentsBulk/column.config.tsx the same
export function useInflicionValues({ preview }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const inflicionValueFieldName = ['inflicionPrice', 'price']
  
  // TODO: fix in preview mode
  const inflicionPrice = Form.useWatch(inflicionValueFieldName, form) ?? ''

  const { lastInvoice } = useCompanyInvoice({ companyId, skip: preview })
  const previousPlacingPrice = lastInvoice?.invoice?.find(
    (item) => item.type === ServiceType.Placing
  )?.sum

  // TODO: recheck. думаю, що треба буде фетчити навіть для прев"ю, бо колись буде едіт
  const { company } = useCompany({
    companyId,
    skip: previousPlacingPrice !== undefined,
  })

  const value =
    previousPlacingPrice ||
    (company?.totalArea &&
      company?.pricePerMeter &&
      company?.totalArea * company?.pricePerMeter)

  return { previousPlacingPrice: value, inflicionPrice }
}

export function AmountElectricityField({ record, preview, edit }) {
  return (
    <FormAttributeForSingle
      lastAmountName={[record.name, 'lastAmount']}
      invoicePropName={ServiceType.Electricity}
      amountName={[record.name, 'amount']}
      disabled={preview}
      edit={edit}
    />
  )
}

export function AmountWaterField({ record, preview, edit }) {
  return (
    <FormAttributeForSingle
      lastAmountName={[record.name, 'lastAmount']}
      amountName={[record.name, 'amount']}
      invoicePropName={ServiceType.Water}
      disabled={preview}
      edit={edit}
    />
  )
}

function FormAttributeForSingle({
  invoicePropName,
  lastAmountName,
  amountName,
  disabled,
  edit
}: {
  invoicePropName: string
  lastAmountName: NamePath
  amountName: NamePath
  disabled?: boolean
  edit?: boolean
}) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { lastInvoice } = useCompanyInvoice({ companyId, skip: disabled })
  const value = lastInvoice?.invoice?.find(
    (item) => item.type === invoicePropName
  )?.amount

  useEffect(() => {
    if (!disabled && !edit) {
      form.setFieldValue(lastAmountName, value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={s.doubleInputs}>
      <Form.Item name={lastAmountName} rules={validateField('required')}>
        <InputNumber disabled={disabled} className={s.input} />
      </Form.Item>

      <Form.Item name={amountName} rules={validateField('required')}>
        <InputNumber disabled={disabled} className={s.input} />
      </Form.Item>
    </div>
  )
}

export function AmountWaterPartField({ preview }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: preview })
  const { service } = useService({ serviceId, skip: preview })

  return (
    <>
      {company?.waterPart && service?.waterPriceTotal
        ? company.waterPart + '% від ' + service?.waterPriceTotal
        : null}
    </>
  )
}

export function AmountInflicionField({ preview }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: preview })
  const { service } = useService({ serviceId, skip: preview })
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })

  const { previousPlacingPrice } = useInflicionValues({ preview })

  const percent = (previousMonth?.inflicionPrice - 100).toFixed(2)
  return (
    <>
      {company?.inflicion && previousMonth?.inflicionPrice
        ? percent + '% від ' + previousPlacingPrice
        : null}
    </>
  )
}

export function AmountDiscountField() {
  return null
}
