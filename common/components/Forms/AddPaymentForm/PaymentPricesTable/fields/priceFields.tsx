import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'

export function PriceMaintainceField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street._id
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company._id

  const { service } = useService({ serviceId, domainId, streetId })
  const { company } = useCompany({ companyId, domainId, streetId })

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('field: ', record.name)
    const price = paymentData?.invoice?.find(
      (item) => item.type === record.name
    ).price
    if (paymentData?.invoice) {
      return form.setFieldValue(fieldName, price)
    }
    if (company?.servicePricePerMeter) {
      form.setFieldValue(fieldName, company.servicePricePerMeter)
    } else if (service?.rentPrice) {
      form.setFieldValue(fieldName, service.rentPrice)
    }
  }, [company?.servicePricePerMeter, service?.rentPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PricePlacingField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company, isLoading } = useCompany({ companyId, domainId, streetId })

  useEffect(() => {
    const price = paymentData?.invoice?.find(
      (item) => item.type === record.name
    ).price
    if (paymentData?.invoice) {
      return form.setFieldValue(fieldName, price)
    }
    if (company?._id && company?.pricePerMeter) {
      form.setFieldValue(fieldName, company.pricePerMeter)
    }
  }, [company?._id, company?.pricePerMeter]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceElectricityField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service, isLoading } = useService({ serviceId, domainId, streetId })

  useEffect(() => {
    const price = paymentData?.invoice?.find(
      (item) => item.type === record.name
    ).price
    if (paymentData?.invoice) {
      return form.setFieldValue(fieldName, price)
    }
    if (service?._id && service?.electricityPrice) {
      form.setFieldValue(fieldName, service.electricityPrice)
    }
  }, [service?._id, service?.electricityPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceWaterField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service, isLoading } = useService({ serviceId, domainId, streetId })

  useEffect(() => {
    const price = paymentData?.invoice?.find(
      (item) => item.type === record.name
    ).price
    if (paymentData?.invoice) {
      return form.setFieldValue(fieldName, price)
    }
    if ((service?._id, service?.waterPrice)) {
      form.setFieldValue(fieldName, service.waterPrice)
    }
  }, [service?._id, service?.waterPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}
