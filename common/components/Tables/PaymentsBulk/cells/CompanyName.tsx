import React from 'react'
import { Form, Typography } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'

interface Props {
  name: number
}

const CompanyName: React.FC<Props> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const companyName: string | undefined = Form.useWatch(
    ['payments', name, 'company', 'companyName'],
    form
  )

  return <Typography.Text>{companyName}</Typography.Text>
}

export default CompanyName