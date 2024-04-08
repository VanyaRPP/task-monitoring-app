import { Invoice } from '../..'
import { Sum } from './'

// TODO: case without inflicion
const Placing: React.FC<{
  record: Invoice
}> = ({ record }) => {
  return <Sum record={record} />
}

export default Placing
