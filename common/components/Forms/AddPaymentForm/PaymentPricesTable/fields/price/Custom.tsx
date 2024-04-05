import { Invoice } from '../..'
import { Price } from './'

const Custom: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Price record={record} preview={preview} />
}

export default Custom
