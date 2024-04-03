import { Invoice } from '../..'

const Custom: React.FC<{ record: Invoice }> = ({ record }) => {
  return <>{record.name}</>
}

export default Custom
