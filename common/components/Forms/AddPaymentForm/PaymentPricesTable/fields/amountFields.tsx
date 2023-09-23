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

export function AmountPlacingField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  const inflicion = paymentData?.invoice.find(
    (i) => i.type === ServiceType.Inflicion
  )
  return company || inflicion ? (
    <AmountPlacingInflicionField record={record} edit={edit} />
  ) : (
    <AmountTotalAreaField record={record} edit={edit} />
  )
}

export function AmountTotalAreaField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'amount']
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })

  
  useEffect(() => {
    if (company?._id && company?.totalArea) {
      form.setFieldValue(fieldName, company.totalArea)
    }
  }, [company?._id, company?.totalArea]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled className={s.input} />
    </Form.Item>
  )
}

function AmountPlacingInflicionField({ record, edit }) {
  const { previousPlacingPrice, inflicionPrice } = useInflicionValues({ edit })
  const fieldName = [record.name, 'placingPrice']
  const { form } = usePaymentContext()

  edit
    ? form.setFieldValue(
        fieldName,
        `${record?.placingPrice}` //view
      )
    : form.setFieldValue(
        fieldName,
        `${previousPlacingPrice}+${inflicionPrice}` //add
      )
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

export function AmountGarbageCollectorField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })
  if (service?.garbageCollectorPrice && company.rentPart) {
    return `${company.rentPart}% від ${service?.garbageCollectorPrice}`
  }
}

// TODO: Could it be helper from @util ?
// PaymentsBulk/column.config.tsx the same
export function useInflicionValues({ edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const inflicionValueFieldName = ['inflicionPrice', 'price']
  
  // TODO: fix in preview mode
  const inflicionPrice = Form.useWatch(inflicionValueFieldName, form) ?? ''

  const { lastInvoice } = useCompanyInvoice({ companyId, skip: edit })
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

export function AmountElectricityField({ record, edit }) {
  return (
    <FormAttributeForSingle
      lastAmountName={[record.name, 'lastAmount']}
      invoicePropName={ServiceType.Electricity}
      amountName={[record.name, 'amount']}
      disabled={edit}
    />
  )
}

export function AmountWaterField({ record, edit }) {
  return (
    <FormAttributeForSingle
      lastAmountName={[record.name, 'lastAmount']}
      amountName={[record.name, 'amount']}
      invoicePropName={ServiceType.Water}
      disabled={edit}
    />
  )
}

function FormAttributeForSingle({
  invoicePropName,
  lastAmountName,
  amountName,
  disabled,
}: {
  invoicePropName: string
  lastAmountName: NamePath
  amountName: NamePath
  disabled?: boolean
}) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { lastInvoice } = useCompanyInvoice({ companyId, skip: disabled })
  const value = lastInvoice?.invoice?.find(
    (item) => item.type === invoicePropName
  )?.amount

  useEffect(() => {
    if (!disabled) {
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

export function AmountWaterPartField({ edit }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  return (
    <>
      {company?.waterPart && service?.waterPriceTotal
        ? company.waterPart + '% від ' + service?.waterPriceTotal
        : null}
    </>
  )
}

export function AmountInflicionField({ edit }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })

  const { previousPlacingPrice } = useInflicionValues({ edit })

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
