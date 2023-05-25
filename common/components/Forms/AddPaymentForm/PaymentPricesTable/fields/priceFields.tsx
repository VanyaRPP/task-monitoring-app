import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'

export function PriceMaintainceField({ record, form, edit }) {
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)
  const companyId = Form.useWatch('company', form)

  const { service } = useService({ serviceId, domainId, streetId })
  const { company } = useCompany({ companyId, domainId, streetId })

  useEffect(() => {
    if (service?._id) {
      if (company.servicePricePerMeter) {
        form.setFieldValue(fieldName, company.servicePricePerMeter)
      } else if (service.rentPrice) {
        form.setFieldValue(fieldName, service.rentPrice)
      }
    }
  }, [service?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PricePlacingField({ record, form, edit }) {
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const companyId = Form.useWatch('company', form)

  const { company, isLoading } = useCompany({ companyId, domainId, streetId })

  useEffect(() => {
    if (company?._id) {
      if (company.pricePerMeter) {
        form.setFieldValue(fieldName, company.pricePerMeter)
      }
    }
  }, [company?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceElectricityField({ record, form, edit }) {
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const { service, isLoading } = useService({ serviceId, domainId, streetId })

  useEffect(() => {
    if (service?._id) {
      if (service.electricityPrice) {
        form.setFieldValue(fieldName, service.electricityPrice)
      }
    }
  }, [service?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}

export function PriceWaterField({ record, form, edit }) {
  const fieldName = [record.name, 'price']

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const { service, isLoading } = useService({ serviceId, domainId, streetId })

  useEffect(() => {
    if (service?._id) {
      if (service.waterPrice) {
        form.setFieldValue(fieldName, service.waterPrice)
      }
    }
  }, [service?._id]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}
