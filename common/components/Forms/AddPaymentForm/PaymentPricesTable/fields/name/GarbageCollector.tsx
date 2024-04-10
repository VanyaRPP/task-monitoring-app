import { Invoice } from '../..'

const GarbageCollector: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Вивіз ТПВ</>
}

export default GarbageCollector
