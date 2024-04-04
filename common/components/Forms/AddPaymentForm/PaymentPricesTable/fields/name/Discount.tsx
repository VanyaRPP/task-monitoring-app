import { Invoice } from '../..'

const Discount: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return <>Знижка</>
}

export default Discount
