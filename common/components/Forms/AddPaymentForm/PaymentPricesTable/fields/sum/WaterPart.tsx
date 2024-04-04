import { Invoice } from '../..'
import { Sum } from './'

const WaterPart: React.FC<{
  record: Invoice
}> = ({ record }) => {
  return <Sum record={record} />
}

export default WaterPart
