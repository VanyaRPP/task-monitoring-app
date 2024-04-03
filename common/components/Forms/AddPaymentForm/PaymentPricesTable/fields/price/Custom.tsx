import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Custom: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return <Price record={record} edit={edit} />
}

export default Custom
