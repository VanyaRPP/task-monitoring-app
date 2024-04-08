import { Invoice } from '../..'
import { Price } from './'

const WaterPart: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Price record={record} preview={preview} />
}

export default WaterPart
