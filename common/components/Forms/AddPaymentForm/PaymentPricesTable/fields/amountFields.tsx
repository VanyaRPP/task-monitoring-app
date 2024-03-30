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
import { getPreviousMonth } from '@common/assets/features/formatDate'

export function AmountPlacingField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const { company } = useCompany({ companyId })
  const inflicion = paymentData?.invoice.find(
    (i) => i.type === ServiceType.Inflicion
  )

  return company?.inflicion || inflicion > 0 ? (
    <AmountPlacingInflicionField
      record={record}
      disabled={disabled}
      inflicion={inflicion}
    />
  ) : (
    <AmountTotalAreaField record={record} disabled={disabled} />
  )
}

export function AmountTotalAreaField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'amount']
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const { company } = useCompany({ companyId })

  // previe mode for first page where u add a payment after use mykolas fixed and get previous values
  useEffect(() => {
    if (company?._id && company?.totalArea && !disabled) {
      form.setFieldValue(fieldName, company.totalArea)
    }
  }, [company?._id, company?.totalArea]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={!disabled && validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

function AmountPlacingInflicionField({ record, disabled, inflicion }) {
  const { previousPlacingPrice, inflicionPrice } = useInflicionValues()
  const fieldName = [record.name, 'placingPrice']
  const { form } = usePaymentContext()

  if (!disabled) {
    form.setFieldValue(fieldName, `${previousPlacingPrice}+${inflicionPrice}`) //view && add
  }
  const previewPrice = typeof inflicion?.price === 'string' ? +inflicion?.price : inflicion?.price
  const value = (previewPrice || +inflicionPrice || 0).toFixed(2)

  return (
    <div className={s.PlacingInflicion}>
      <p>
        {previousPlacingPrice}+{value}
      </p>
      <StyledTooltip
        title={`Значення попереднього місяця + індекс інфляції в цьому рахунку`}
      />
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
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const inflicionValueFieldName = ['inflicionPrice', 'price']

  // TODO: fix in edit mode
  const inflicionPrice = Form.useWatch(inflicionValueFieldName, form) ?? ''

  const previousPlacingPrice = usePrevPlacingPrice({ companyId })
  const defaultPlacingPrice = useDefaultPlacingPrice({ previousPlacingPrice, companyId })
  const value = previousPlacingPrice || defaultPlacingPrice


  // const [defaultPrevPrice] = useState(+value - inflicionPrice)
  // const prevPrice = isEdit ? defaultPrevPrice : value

  return { previousPlacingPrice: value, inflicionPrice }
}

const usePrevPlacingPrice = ({ companyId }: { companyId: string; }) => {
  // const { paymentData } = usePaymentContext()
  // const { month, year } = getPreviousMonth(paymentData?.monthService?.date)
  // const { lastInvoice } = useCompanyInvoice({ companyId, month, year })
  // TODO: DATA EDITING NOT WORKING
  const { lastInvoice } = useCompanyInvoice({ companyId })
  const previousPlacingPrice = lastInvoice?.invoice?.find(
    (item) => item.type === ServiceType.Placing
  )?.sum
  return previousPlacingPrice
}

const useDefaultPlacingPrice = ({ previousPlacingPrice, companyId }: { previousPlacingPrice?: number; companyId: string; }) => {
  // function used if it is first invoice and there is no info about prev pricing
  const { company } = useCompany({
    companyId,
    skip: previousPlacingPrice !== undefined || !companyId,
  })
  const defaultPlacingPrice = company?.totalArea && company?.pricePerMeter &&
    company?.totalArea * company?.pricePerMeter

  return defaultPlacingPrice
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

  const { previousPlacingPrice } = useInflicionValues()

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
