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
import { useEffect, useState } from 'react'
import s from '../style.module.scss'
import { parseStringToFloat } from '@utils/helpers'
// import { getPreviousMonth } from '@common/assets/features/formatDate'

export function AmountPlacingField({ company, record, disabled }) {
  return company?.inflicion ? (
    <AmountPlacingInflicionField
      record={record}
      // inflicion={inflicion}
      inflicion={0}
    />
  ) : (
    <AmountTotalAreaField record={record} />
  )
}

export function AmountTotalAreaField({ record }) {
  return (
    <Form.Item name={[record.name, 'amount']}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

function AmountPlacingInflicionField({ record, inflicion }) {
  // TODO: test inflicionPrice
  const { inflicionPrice } = useInflicionValues()
  const { previousPlacingPrice } = record

  const inflicionValue = typeof inflicion?.price === 'string' ? +inflicion?.price : inflicion?.price
  const value = (inflicionValue || +inflicionPrice || 0).toFixed(2)

  return (
    <div className={s.PlacingInflicion}>
      <p>
        {previousPlacingPrice}+{value}
      </p>
      <StyledTooltip title={`Значення попереднього місяця + індекс інфляції в цьому рахунку`} />
    </div>
  )
}

export function AmountGarbageCollectorField() {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService?._id
  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })
  if (service?.garbageCollectorPrice && company?.rentPart) {
    return `${company?.rentPart}% від ${service?.garbageCollectorPrice}`
  }
}

// TODO: Could it be helper from @util ?
// PaymentsBulk/column.config.tsx the same
export function useInflicionValues() {
  const { form } = usePaymentContext()
  const inflicionValueFieldName = ['inflicionPrice', 'price']
  const inflicionPrice = Form.useWatch(inflicionValueFieldName, form) ?? ''

  return { inflicionPrice }
}

export function AmountElectricityField({ record, disabled }) {
  return (
    <FormAttributeForSingle
      lastAmountName={[record.name, 'lastAmount']}
      invoicePropName={ServiceType.Electricity}
      amountName={[record.name, 'amount']}
      disabled={disabled}
    />
  )
}

export function AmountWaterField({ record, disabled }) {
  return (
    <FormAttributeForSingle
      lastAmountName={[record.name, 'lastAmount']}
      amountName={[record.name, 'amount']}
      invoicePropName={ServiceType.Water}
      disabled={disabled}
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
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  // const { month, year } = getPreviousMonth(paymentData?.monthService?.date)
  // const { lastInvoice } = useCompanyInvoice({ companyId, month, year })
  const { lastInvoice } = useCompanyInvoice({ companyId })
  const value = lastInvoice?.invoice?.find(
    (item) => item.type === invoicePropName
  )?.amount

  useEffect(() => {
    if (!disabled) {
      form.setFieldValue(lastAmountName, parseStringToFloat(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={s.doubleInputs}>
      <Form.Item name={lastAmountName} rules={validateField('required')}>
        <InputNumber className={s.input} />
      </Form.Item>

      <Form.Item name={amountName} rules={validateField('required')}>
        <InputNumber className={s.input} />
      </Form.Item>
    </div>
  )
}

export function AmountWaterPartField() {
  const { paymentData, form } = usePaymentContext()
  const serviceIdRaw =
    Form.useWatch('monthService', form) || paymentData?.monthService?._id
  const serviceId =
    typeof serviceIdRaw === 'object' ? serviceIdRaw._id : serviceIdRaw
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })

  return (
    <>
      {company?.waterPart && service?.waterPriceTotal
        ? company.waterPart + '% від ' + service?.waterPriceTotal
        : null}
    </>
  )
}

export function AmountInflicionField() {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService?._id
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })

  // const { previousPlacingPrice } = record
  // TODO: wip
  const previousPlacingPrice = 'wip'

  const percent = (previousMonth?.inflicionPrice - 100)?.toFixed(2)
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
