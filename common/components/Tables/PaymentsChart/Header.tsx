import { SelectOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

interface Props {
  paymentsLimit: number,
  setPaymentsLimit: (paymentsLimit: number) => void,
  selectValues: Array<{ label: string; value: string }>,
  setCompanyId: (domainId: string) => void,
  companyName: string
}

const PaymentsChartHeader: React.FC<Props> = ({ paymentsLimit, setPaymentsLimit, selectValues, setCompanyId, companyName }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const options = [10, 20, 30, 40, 50]
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = userResponse?.roles?.includes(Roles.DOMAIN_ADMIN)

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
      {(isGlobalAdmin || isDomainAdmin) && (
        <Select
          defaultValue={companyName}
          className={s.companySelector}
          onChange={setCompanyId}
          options={selectValues}
        />
      )}
    </div>
  )
}

export default PaymentsChartHeader