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
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { service } = useService({ serviceId, domainId, streetId, skip: edit })
  const { company } = useCompany({ companyId, skip: edit })

  useEffect(() => {
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
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })

  useEffect(() => {
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

export function PriceElectricityField({ record, edit, previousInvoiceData }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service } = useService({ serviceId, domainId, streetId, skip: edit })

  useEffect(() => {
    if (service?._id && service?.electricityPrice) {
      // Встановлюємо значення з попереднього інвойсу, якщо воно передане
      const previousElectricityPrice = previousInvoiceData?.electricityPrice
      form.setFieldValue(
        fieldName,
        previousElectricityPrice || service.electricityPrice
      )
    }
  }, [service?._id, service?.electricityPrice, previousInvoiceData]) //eslint-disable-line react-hooks/exhaustive-deps

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

  const { service, isLoading } = useService({
    serviceId,
    domainId,
    streetId,
    skip: edit,
  })

  useEffect(() => {
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

export function PriceGarbageCollectorField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })

  useEffect(() => {
    if (company?._id && company?.garbageCollector) {
      form.setFieldValue(fieldName, company.garbageCollector)
    }
  }, [company?._id, company?.garbageCollector]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceInflicionField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })

  const { service, isLoading } = useService({
    serviceId,
    domainId,
    streetId,
    skip: edit,
  })

  useEffect(() => {
    if (service?._id && service?.inflicionPrice) {
      form.setFieldValue(
        fieldName,
        service.inflicionPrice * company.pricePerMeter
      )
    }
  }, [service?._id, service?.inflicionPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceWaterPartField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })

  const { service, isLoading } = useService({
    serviceId,
    domainId,
    streetId,
    skip: edit,
  })

  useEffect(() => {
    if (service?._id && service?.inflicionPrice) {
      form.setFieldValue(fieldName, company.waterPart)
    }
  }, [service?._id, service?.inflicionPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}
