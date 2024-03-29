import { SelectOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import PaymentsSelector from '@common/components/PaymentSelector'

interface Props {
  paymentsLimit: number
  setPaymentsLimit: (paymentsLimit: number) => void
  setCompanyId: (companyId: string) => void
}

const PaymentsChartHeader: React.FC<Props> = ({
  paymentsLimit,
  setPaymentsLimit,
  setCompanyId,
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
