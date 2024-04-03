import { Invoice } from '../..'
import { Sum } from '../../fields/sum'

const Discount: React.FC<{ record: Invoice }> = ({ record }) => {
  return <Sum record={record} />
}

export default Discount
