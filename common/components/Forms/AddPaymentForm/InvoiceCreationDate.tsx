import { Form, DatePicker, ConfigProvider } from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from '@utils/dayjs'


dayjs.locale('uk')

export default function InvoiceCreationDate({ edit }) {
  return (
    <ConfigProvider locale={ukUA}>
      <Form.Item name="invoiceCreationDate" label="Оплата від">
        <DatePicker format="DD.MM.YYYY" disabled={edit} />
      </Form.Item>
    </ConfigProvider>
  )
}
