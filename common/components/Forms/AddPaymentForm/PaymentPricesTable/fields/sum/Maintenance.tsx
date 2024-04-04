import { Invoice } from '../..'
import { Sum } from './'

const Maintenance: React.FC<{
  record: Invoice
}> = ({ record }) => {
  return <Sum record={record} />
}

export default Maintenance
