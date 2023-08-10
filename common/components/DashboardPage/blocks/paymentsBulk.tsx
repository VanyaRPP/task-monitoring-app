import PaymentBulkCardHeader from '@common/components/UI/PaymentBulkCardHeader'
import TableCard from '@common/components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import cn from 'classnames'
import { useRouter } from 'next/router'
import s from './style.module.scss'

const PaymentBulkBlock: React.FC = () => {
  const router = useRouter()
  const { pathname } = router

  // TODO: table and other
  const content = <></>

  return (
    <TableCard
      title={<PaymentBulkCardHeader />}
      className={cn({ [s.noScroll]: pathname === AppRoutes.PAYMENT_BULK })}
    >
      {content}
    </TableCard>
  )
}

export default PaymentBulkBlock
