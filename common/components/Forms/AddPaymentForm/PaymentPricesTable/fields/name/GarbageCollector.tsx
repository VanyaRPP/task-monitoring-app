import { Form } from 'antd'
import { Invoice } from '../..'

const GarbageCollector: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Вивіз ТПВ</Form.Item>
}

export default GarbageCollector
