import { Invoice } from '../..'
import { Amount } from './'

const Maintenance: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Amount record={record} preview={preview} />
}

export default Maintenance
