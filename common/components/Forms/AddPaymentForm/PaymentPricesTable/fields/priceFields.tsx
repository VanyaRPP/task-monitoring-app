import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import useService, {
  usePreviousMonthService,
} from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useInflicionValues } from './amountFields'
import { getInflicionValue } from '@utils/inflicionHelper'

export function PriceMaintainceField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { service } = useService({ serviceId })
  const { company } = useCompany({ companyId })

  useEffect(() => {
    if (company?.servicePricePerMeter && !disabled) {
      form.setFieldValue(fieldName, company.servicePricePerMeter)
    } else if (service?.rentPrice && !disabled) {
      form.setFieldValue(fieldName, service.rentPrice)
    }
  }, [company?.servicePricePerMeter, service?.rentPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled className={s.input} />
    </Form.Item>
  )
}

export function PricePlacingField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId })

  return company?.inflicion ? (
    <InflicionPricePlacingField record={record} disabled={disabled} />
  ) : (
    <DefaultPricePlacingField company={company} record={record} disabled={disabled} />
  )
}

function DefaultPricePlacingField({ company, record, disabled }) {
  const { form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  useEffect(() => {
    if (company?._id && company?.pricePerMeter && !disabled) {
      form.setFieldValue(fieldName, company.pricePerMeter)
    }
  }, [company?._id, company?.pricePerMeter]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled className={s.input} />
    </Form.Item>
  )
}

function InflicionPricePlacingField({ record, disabled }) {
  const { form } = usePaymentContext()
  const fieldName = [record.name, 'price']
  const { previousPlacingPrice, inflicionPrice } = useInflicionValues()

  useEffect(() => {
    if (!disabled) {
      form.setFieldValue(fieldName, (+previousPlacingPrice + +inflicionPrice).toFixed(1))
    }
  }, [previousPlacingPrice, inflicionPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceElectricityField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service } = useService({ serviceId })

  useEffect(() => {
    if (service?._id && service?.electricityPrice && !disabled) {
      form.setFieldValue(fieldName, service.electricityPrice)
    }
  }, [service?._id, service?.electricityPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceWaterField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service } = useService({ serviceId })

  useEffect(() => {
    if ((service?._id, service?.waterPrice) && !disabled) {
      form.setFieldValue(fieldName, service.waterPrice)
    }
  }, [service?._id, service?.waterPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceGarbageCollectorField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })

  useEffect(() => {
    if (
      service?._id &&
      company?.garbageCollector &&
      service?.garbageCollectorPrice &&
      !disabled
    ) {
      form.setFieldValue(
        fieldName,
        ((service.garbageCollectorPrice / 100) * company.rentPart)?.toFixed(1)
      )
    }
  }, [service?._id, company?.garbageCollector]) //eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceInflicionField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })
  const { previousPlacingPrice } = useInflicionValues()

  useEffect(() => {
    if (service?._id && service?.inflicionPrice && company?.inflicion && !disabled) {
      const inflicionAmount = getInflicionValue(
        previousPlacingPrice,
        previousMonth?.inflicionPrice
      )
      form.setFieldValue(fieldName, +inflicionAmount > 0 ? inflicionAmount : 0)
    }
  }, [service?._id, service?.inflicionPrice, previousPlacingPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceWaterPartField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form)

  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })

  useEffect(() => {
    if (service?._id && company?.waterPart && !disabled) {
      form.setFieldValue(
        fieldName,
        ((company.waterPart / 100) * service?.waterPriceTotal)?.toFixed(2)
      )
    }
  }, [service?._id, company?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceDiscountField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId })

  useEffect(() => {
    if (company?.discount && !disabled) {
      form.setFieldValue(fieldName, company.discount)
    }
  }, [company?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceCleaningField({ record, disabled }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId })

  useEffect(() => {
    if (company?.cleaning && !disabled) {
      form.setFieldValue(fieldName, company.cleaning)
    }
  }, [company?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}

export function PriceCustomField({ record }) {
  const { form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  useEffect(() => {
    form.setFieldValue(fieldName, record.sum)
  }, []) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber className={s.input} />
    </Form.Item>
  )
}