import { Invoice } from '../..'

const WaterPart: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return <>Частка одопостачання</>
}

export default WaterPart
