import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Inflicion: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, prevService, prevPayment } = usePaymentContext()

  if (company?.inflicion) {
    const prevPlacing =
      prevPayment?.invoice.find(
        (invoice) => invoice.type === ServiceType.Placing
      )?.sum || 0
    const inflicion = prevService?.inflicionPrice

    return (
      <Price
        record={record}
        edit={edit}
        initialValue={Math.max((+prevPlacing * (+inflicion - 100)) / 100, 0)}
      />
    )
  }

  return <Price record={record} edit={edit} />
}

export default Inflicion
