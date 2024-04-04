import { Invoice } from '../..'
import { Amount } from './'

const Electricity: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Amount record={record} preview={preview} last />
      <Amount record={record} preview={preview} />
    </div>
  )
}

export default Electricity
