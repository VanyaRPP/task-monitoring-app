import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const GarbageCollector: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, service } = usePaymentContext()

  if (company?.garbageCollector) {
    return (
      <Price
        record={record}
        edit={edit}
        initialValue={
          (+service?.garbageCollectorPrice / 100) * +company.rentPart
        }
      />
    )
  }

  return <Price record={record} edit={edit} />
}

export default GarbageCollector
