import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useInflicionValues } from './amountFields'

export function PriceMaintainceField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { service } = useService({ serviceId, skip: edit })
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
      <InputNumber disabled className={s.input} />
    </Form.Item>
  )
}

export function PricePlacingField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })

  return company?.inflicion ? (
    <InflicionPricePlacingField record={record} edit={edit} />
  ) : (
    <DefaultPricePlacingField company={company} record={record} edit={edit} />
  )
}

function DefaultPricePlacingField({ company, record, edit }) {
  const { form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  useEffect(() => {
    if (company?._id && company?.pricePerMeter) {
      form.setFieldValue(fieldName, company.pricePerMeter)
    }
  }, [company?._id, company?.pricePerMeter]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled className={s.input} />
    </Form.Item>
  )
}

function InflicionPricePlacingField({ record, edit }) {
  const { form } = usePaymentContext()
  const fieldName = [record.name, 'price']
  const { previousPlacingPrice, inflicionPrice } = useInflicionValues({ edit })

  useEffect(() => {
    form.setFieldValue(fieldName, +previousPlacingPrice + +inflicionPrice)
  }, [previousPlacingPrice, inflicionPrice]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceElectricityField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service } = useService({ serviceId, skip: edit })

  useEffect(() => {
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

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { service } = useService({ serviceId, skip: edit })

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
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService

  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  useEffect(() => {
    if (
      service?._id &&
      company?.garbageCollector &&
      service?.garbageCollectorPrice
    ) {
      form.setFieldValue(
        fieldName,
        (service.garbageCollectorPrice / 100) * company.rentPart
      )
    }
  }, [service?._id, company?.garbageCollector]) //eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceInflicionField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  // TODO: вивчити формулу. потім ціна оренди береться із суми індексу інфляції і поточної оренди
  // БРАТИ ЦІНУ ОРЕНДИ З МИНУЛОГО ІНВОЙСУ
  // подумати про хелпер з тестами

  useEffect(() => {
    if (service?._id && service?.inflicionPrice && company.inflicion) {
      const rentPrice = company?.pricePerMeter * company?.totalArea
      const percent = service?.inflicionPrice - 100
      const inflicionAmount = ((rentPrice * percent) / 100).toFixed(2)
      form.setFieldValue(fieldName, inflicionAmount)
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

  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  useEffect(() => {
    if (service?._id && company?.waterPart) {
      form.setFieldValue(
        fieldName,
        ((company.waterPart / 100) * service?.waterPriceTotal).toFixed(2)
      )
    }
  }, [service?._id, company?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceDiscountField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'price']

  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })

  useEffect(() => {
    if (company?.discount) {
      form.setFieldValue(fieldName, company.discount)
    }
  }, [company?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}
