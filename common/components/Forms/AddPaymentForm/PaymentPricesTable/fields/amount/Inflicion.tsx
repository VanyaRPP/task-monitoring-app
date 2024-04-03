import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Invoice } from '../..'
import { Amount } from '../../fields/amount'

const Inflicion: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, payment, prevPayment } = usePaymentContext()

  // TODO: handle case when THIS payments if first, so `prevPayment === undefined`
  if (company?.inflicion) {
    const prevPlacing =
      prevPayment?.invoice.find(
        (invoice) => invoice.type === ServiceType.Placing
      )?.sum || 0
    const inflicion =
      payment?.invoice.find((invoice) => invoice.type === ServiceType.Inflicion)
        ?.sum - 100 || 0

    return (
      <>
        {(+inflicion).toFixed(2)}% від {(+prevPlacing).toFixed(2)}
      </>
    )
  }

  return <Amount record={record} edit={edit} />
}

export default Inflicion
