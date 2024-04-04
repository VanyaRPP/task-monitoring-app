import { Invoice } from '../..'

const Unknown: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return <>Unknown</>
}

export default Unknown
