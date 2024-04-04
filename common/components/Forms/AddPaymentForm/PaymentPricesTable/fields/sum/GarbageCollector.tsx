import { Invoice } from '../..'
import { Sum } from './'

const GarbageCollector: React.FC<{
  record: Invoice
}> = ({ record }) => {
  return <Sum record={record} />
}

export default GarbageCollector
