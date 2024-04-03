import { Invoice } from '../..'
import { Sum } from '../../fields/sum'

const Electricity: React.FC<{ record: Invoice }> = ({ record }) => {
  return <Sum record={record} />
}

export default Electricity
