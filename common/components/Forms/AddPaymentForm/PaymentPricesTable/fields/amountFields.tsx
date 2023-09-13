import { InputNumber, Form, Tooltip } from 'antd'
import { useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import s from '../style.module.scss'
import useCompany from '@common/modules/hooks/useCompany'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useCompanyInvoice } from '@common/modules/hooks/usePayment'
import { ServiceType } from '@utils/constants'
import { QuestionCircleOutlined } from '@ant-design/icons'

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

export function AmountPlacingInflicionField({ company, edit }) {
  const { previousPlacingPrice, inflicionPrice } = useInflicionValues({ edit })
  return (
    <>
      {previousPlacingPrice}+{inflicionPrice}{' '}
      <Tooltip
        title={`Попередній місяць розміщення + індекс інфляції в цьому рахунку`}
      >
        <QuestionCircleOutlined />
      </Tooltip>
    </>
  )
}

export function useInflicionValues({ edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const inflicionValueFieldName = ['inflicionPrice', 'price']

  // TODO: fix in preview mode default value instead of 'fix me in preview'
  const inflicionPrice =
    Form.useWatch(inflicionValueFieldName, form) ?? 'fix me in preview'

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
