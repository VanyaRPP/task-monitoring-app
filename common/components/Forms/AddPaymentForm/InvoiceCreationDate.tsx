import { Form, DatePicker } from 'antd'

export default function InvoiceCreationDate({ edit }) {
  return (
    <Form.Item name="invoiceCreationDate" label="Оплата від">
      <DatePicker format="DD.MM.YYYY" disabled={edit} />
    </Form.Item>
  )
}
