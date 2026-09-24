import React from 'react'
import { Form, Tooltip, Typography } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { calcCompanyTotal, listCompanyTotalItems } from '../totalSum'

const TotalSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  // Слухаємо весь invoice компанії — перерахунок при будь-якій зміні послуг.
  const invoice = Form.useWatch(['payments', name, 'invoice'], form)
  const items = listCompanyTotalItems(invoice)

  return (
    <Tooltip
      title={
        items.length
          ? items.map((i) => <div key={i.label}>{`${i.label}: ${i.sum}`}</div>)
          : 'Послуг не виставлено'
      }
    >
      <Typography.Text strong data-testid="company-total">
        {calcCompanyTotal(invoice)}
      </Typography.Text>
    </Tooltip>
  )
}

export default TotalSum
