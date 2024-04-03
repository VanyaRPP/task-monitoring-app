import { Invoice } from '../..'
import { Amount } from '../../fields/amount'

const Custom: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return <Amount record={record} edit={edit} />
}

export default Custom
