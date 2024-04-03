import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Amount } from '../../fields/amount'

const GarbageCollector: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, service } = usePaymentContext()

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <>
        {company?.rentPart}% від {service?.garbageCollectorPrice}
      </>
    )
  }

  return <Amount record={record} edit={edit} />
}

export default GarbageCollector
