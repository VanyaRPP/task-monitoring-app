import { Invoice } from '../..'
import { Sum } from '../../fields/sum'

const Custom: React.FC<{ record: Invoice }> = ({ record }) => {
  return <Sum record={record} />
}

export default Custom
