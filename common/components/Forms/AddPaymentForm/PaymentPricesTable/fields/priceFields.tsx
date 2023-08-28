import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'

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

export function OldElectricity({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  // TODO: useCompanyInvoice
  const { data: paymentsResponse } = useGetAllPaymentsQuery(
    { companyIds: [companyId], limit: 1 },
    { skip: edit }
  )
  const invoice = paymentsResponse?.data?.[0]?.invoice
  const electricityPrice = invoice?.find(
    (item) => item.type === 'electricityPrice'
  )?.amount
  const lastAmountName = [record.name, 'lastAmount']

  useEffect(() => {
    form.setFieldValue(lastAmountName, electricityPrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electricityPrice])

  // TOOD: is it possible to use FormAttribute ?
  return (
    <div className={s.doubleInputs}>
      <Form.Item name={lastAmountName} rules={validateField('required')}>
        <InputNumber disabled={edit} className={s.input} />
      </Form.Item>

      <Form.Item
        name={[record.name, 'amount']}
        rules={validateField('required')}
      >
        <InputNumber disabled={edit} className={s.input} />
      </Form.Item>
    </div>
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

export function WaterPartInfo({ edit }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  return (
    <>
      {company?.waterPart && service?.waterPriceTotal
        ? company.waterPart + '% від суми ' + service?.waterPriceTotal
        : null}
    </>
  )
}

export function InflicionAmountInfo({ edit }) {
  const { paymentData, form } = usePaymentContext()
  const serviceId =
    Form.useWatch('monthService', form) || paymentData?.monthService
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  const { service } = useService({ serviceId, skip: edit })

  const percent = (service?.inflicionPrice - 100).toFixed(2)
  const rentPrice = company?.pricePerMeter * company?.totalArea

  return (
    <>
      {company?.inflicion && service?.inflicionPrice
        ? percent + '% інфляції від ' + rentPrice
        : null}
    </>
  )
}
