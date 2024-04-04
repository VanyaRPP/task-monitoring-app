import { Invoice } from '../..'
import { Sum } from './'

const Inflicion: React.FC<{
  record: Invoice
}> = ({ record }) => {
  return <Sum record={record} />
}

export default Inflicion
