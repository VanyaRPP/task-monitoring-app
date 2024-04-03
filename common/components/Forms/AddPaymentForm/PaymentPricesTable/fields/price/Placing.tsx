import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Invoice } from '../..'
import { Price } from '../../fields/price'

const Placing: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const { company, prevPayment } = usePaymentContext()

  // TODO: fix without useEffect initialValue not loading
  // TODO: fix with useEffect updated value reloading on tab change
  // useEffect(() => {
  //   if (company?.inflicion) {
  //     const prevPlacing =
  //       prevPayment?.invoice?.find(
  //         (invoice) => invoice.type === ServiceType.Placing
  //       )?.sum || 0
  //     form.setFieldValue(['invoice', record.name, 'price'], prevPlacing)
  //   }
  // }, [company, prevPayment, form])

  if (company?.inflicion) {
    const prevPlacing =
      prevPayment?.invoice?.find(
        (invoice) => invoice.type === ServiceType.Placing
      )?.sum || 0

    return <Price record={record} edit={edit} initialValue={+prevPlacing} />
  }

  return <Price record={record} edit={edit} />
}

export default Placing
