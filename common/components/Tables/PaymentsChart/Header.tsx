import { SelectOutlined } from '@ant-design/icons'
import PaymentsSelector from '@components/PaymentSelector'
import { AppRoutes } from '@utils/constants'
import { Button, Select } from 'antd'
import { useRouter } from 'next/router'
import s from './style.module.scss'

interface Props {
  paymentsLimit: number
  setPaymentsLimit: (paymentsLimit: number) => void
  setCompanyId: (companyId: string) => void
  canShowChart: boolean
}

const PaymentsChartHeader: React.FC<Props> = ({
  paymentsLimit,
  setPaymentsLimit,
  setCompanyId,
  canShowChart,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const options = [10, 20, 30, 40, 50]

  return (
    <div className={s.chartBlock}>
      <Button
        type="link"
        onClick={() => {
          router.push(AppRoutes.PAYMENTS_CHARTS)
        }}
      >
        Графіки платежів
        <SelectOutlined />
      </Button>
      {isOnPage && (
        <Select
          options={options?.map((value) => ({
            value: value,
            label: value,
          }))}
          onChange={setPaymentsLimit}
          defaultValue={paymentsLimit}
        />
      )}
      <PaymentsSelector setCompanyId={setCompanyId} />
    </div>
  )
}

export default PaymentsChartHeader
