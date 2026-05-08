import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { toFirstUpperCase } from '@utils/helpers'
import { FormInstance, Space, Typography } from 'antd'
import { ReactNode } from 'react'
import UpdateInvoiceButton from './UpdateInvoiceButton'

export interface InvoiceRowNameProps {
  form?: FormInstance
  name?: string | string[] | number | number[]
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
  serviceType,
  editable,
  disabled,
  label,
  middle,
  subtitle,
}) => {
  const { service } = usePaymentContext()
  const defaultSubtitle = toFirstUpperCase(dateToMonthYear(service?.date))

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        <Typography.Text>{label}</Typography.Text>
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
