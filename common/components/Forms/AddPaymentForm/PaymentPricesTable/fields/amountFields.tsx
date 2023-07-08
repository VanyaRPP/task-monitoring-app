import { InputNumber, Form } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import { usePaymentContext } from '@common/components/AddPaymentModal'

export function AmountTotalAreaField({ record, edit }) {
  const { paymentData, form } = usePaymentContext()
  const fieldName = [record.name, 'amount']

  const domainId = Form.useWatch('domain', form) || paymentData?.domain
  const streetId = Form.useWatch('street', form) || paymentData?.street
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const { company, isLoading } = useCompany({ companyId, domainId, streetId, skip: edit })

  useEffect(() => {
    if (company?._id && company?.totalArea) {
      form.setFieldValue(fieldName, company.totalArea)
    }
  }, [company?._id, company?.totalArea]) //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name={fieldName} rules={validateField('required')}>
      <InputNumber disabled={edit} className={s.input} />
    </Form.Item>
  )
}
