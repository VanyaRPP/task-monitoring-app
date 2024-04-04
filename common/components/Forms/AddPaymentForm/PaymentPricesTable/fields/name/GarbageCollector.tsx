import { Invoice } from '../..'

const GarbageCollector: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return <>Вивіз ТПВ</>
}

export default GarbageCollector
