import { Invoice } from '../..'
import { Amount } from '../../fields/amount'

const Water: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Amount record={record} edit={edit} last />
      <Amount record={record} edit={edit} />
    </div>
  )
}

export default Water
