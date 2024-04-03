import { Invoice } from '../..'
import { Sum } from '../../fields/sum'

const Maintenance: React.FC<{ record: Invoice }> = ({ record }) => {
  return <Sum record={record} />
}

export default Maintenance
