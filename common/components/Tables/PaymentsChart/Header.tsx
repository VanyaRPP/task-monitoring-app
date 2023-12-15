import { SelectOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isAdminCheck } from '@utils/helpers'
import {
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

interface Props {
  paymentsLimit: number,
  setPaymentsLimit: (paymentsLimit: number) => void,
  selectValues: Array<{ label: string; value: string }>,
  setCompanyId: (domainId: string) => void,
}

const PaymentsChartHeader: React.FC<Props> = ({ paymentsLimit, setPaymentsLimit, selectValues, setCompanyId}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENTS_CHARTS
  const options = [10, 20, 30, 40, 50]
  const { data: user } = useGetCurrentUserQuery()
  const { data: domains } = useGetDomainsQuery({})
  const { data: realEstates } = useGetAllRealEstateQuery({ domainId: domains?.[0]._id })
  setCompanyId(realEstates?.data[0]._id)

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
      {isAdminCheck(user?.roles) && (
        <Select
          defaultValue={realEstates?.data[0]._id}
          className={s.companySelector}
          onChange={setCompanyId}
          options={selectValues}
        />
      )}
    </div>
  )
}

export default PaymentsChartHeader