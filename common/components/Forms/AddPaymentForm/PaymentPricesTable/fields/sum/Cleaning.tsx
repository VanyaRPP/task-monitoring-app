import { Invoice } from '../..'
import { Sum } from './'

const Cleaning: React.FC<{
  record: Invoice
}> = ({ record }) => {
  return <Sum record={record} />
}

export default Cleaning
