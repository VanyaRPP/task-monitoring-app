import { Invoice } from '../..'
import { Price } from './'

const Custom: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return <Price record={record} preview={preview} />
}

export default Custom
