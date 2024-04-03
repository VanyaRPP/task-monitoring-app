import { Invoice } from '../..'
import { Sum } from '../../fields/sum'

const Water: React.FC<{ record: Invoice }> = ({ record }) => {
  return <Sum record={record} />
}

export default Water
