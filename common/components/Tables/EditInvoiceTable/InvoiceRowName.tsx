import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceType } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase } from '@utils/helpers'
import { Form, FormInstance, Space, Typography } from 'antd'
import { ReactNode, useEffect, useMemo } from 'react'
import { LabelInput } from './LabelInput'
import UpdateInvoiceButton from './UpdateInvoiceButton'

export interface InvoiceRowNameProps {
  form?: FormInstance
  name?: string | string[] | number | number[]
  record?: InvoiceType
  serviceType: ServiceType
  editable?: boolean
  disabled?: boolean
  label: ReactNode
  middle?: ReactNode
  subtitle?: ReactNode
}

const InvoiceRowName: React.FC<InvoiceRowNameProps> = ({
  form,
  name,
  record,
  serviceType,
  editable,
  disabled,
  label,
  middle,
  subtitle,
}) => {
  const { service } = usePaymentContext()
  const defaultSubtitle = toFirstUpperCase(dateToMonthYear(service?.date))
  const nameArr = useMemo(
    () => (name !== undefined ? toArray<string>(name) : []),
    [name]
  )

  // Seed `description` with the visible label when the row first appears
  // and only if the form does not already carry a value for that field.
  useEffect(() => {
    if (!editable || !form || !nameArr.length || typeof label !== 'string')
      return
    const current = form.getFieldValue(['invoice', ...nameArr, 'description'])
    if (!current) {
      form.setFieldValue(['invoice', ...nameArr, 'description'], label)
    }
  }, [label, editable, form, nameArr])

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        {editable && nameArr.length > 0 ? (
          <Form.Item name={[...nameArr, 'description']} style={{ margin: 0 }}>
            <LabelInput
              defaultLabel={typeof label === 'string' ? label : undefined}
              disabled={disabled}
            />
          </Form.Item>
        ) : (
          <Typography.Text>
            {record?.description || label}
          </Typography.Text>
        )}
        {middle ? (
          <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
            {middle}
          </Typography.Text>
        ) : null}
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {subtitle ?? defaultSubtitle}
        </Typography.Text>
      </Space>
      {editable && (
        <UpdateInvoiceButton
          form={form!}
          name={name!}
          serviceType={serviceType}
          disabled={disabled}
        />
      )}
    </Space>
  )
}

export default InvoiceRowName
