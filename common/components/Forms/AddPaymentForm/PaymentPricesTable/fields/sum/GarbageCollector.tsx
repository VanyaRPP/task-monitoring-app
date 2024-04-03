import { Invoice } from '../..'
import { Sum } from '../../fields/sum'

const GarbageCollector: React.FC<{ record: Invoice }> = ({ record }) => {
  return <Sum record={record} />
}

export default GarbageCollector
