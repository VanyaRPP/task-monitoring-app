import { Invoice } from '../..'
import { Amount } from './'

const Maintenance: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return <Amount record={record} preview={preview} />
}

export default Maintenance
