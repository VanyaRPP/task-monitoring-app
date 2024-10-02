import { ExportOutlined } from '@ant-design/icons'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { usePaymentsChartConfig } from '@components/DashboardPage/PaymentsChart/hooks/usePaymentsChartConfig'
import { usePaymentsChartData } from '@components/DashboardPage/PaymentsChart/hooks/usePaymentsChartData'
import { AppRoutes, Operations, Roles } from '@utils/constants'
import {
  Button,
  Card,
  Empty,
  Flex,
  Select,
  SelectProps,
  Space,
  Spin,
  theme,
} from 'antd'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

const Line = dynamic(
  () => import('@ant-design/plots').then(({ Line }) => Line),
  { ssr: false }
)

const PaymentsChart: React.FC<{
  style?: React.CSSProperties
  className?: string
}> = ({ style, className }) => {
  const router = useRouter()
  const { token } = theme.useToken()
  const { data: user } = useGetCurrentUserQuery()

  const isDomainAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.DOMAIN_ADMIN)
  }, [user])
  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])

  const [companyId, setCompanyId] = useState<string>()
  const [size, setSize] = useState<number>(
    router.pathname === AppRoutes.PAYMENT_CHART ? 10 : 5
  )

  const {
    data: { data: payments } = { data: [] },
    isError,
    isFetching,
  } = useGetAllPaymentsQuery(
    {
      limit: size,
      type: Operations.Debit,
      companyIds: [companyId],
    },
    {
      skip: (!isGlobalAdmin && !isDomainAdmin) || !companyId,
    }
  )

  const chartData: any = usePaymentsChartData(payments)
  const chartConfig: any = usePaymentsChartConfig()

  const isValid = useMemo(() => {
    return (
      (isGlobalAdmin || isDomainAdmin) &&
      payments?.length &&
      companyId &&
      !isError
    )
  }, [companyId, payments, isGlobalAdmin, isDomainAdmin, isError])


  console.log(chartData)

  return (
    <Card
      title={
        <Flex justify="space-between" align="center">
          <Space>
            <Link href={AppRoutes.PAYMENT_CHART}>
              <Button type="link" icon={<ExportOutlined />}>
                Графік платежів
              </Button>
            </Link>
            <CompanySelector
              value={companyId}
              onChange={setCompanyId}
              style={{ width: 200, fontWeight: 'normal' }}
            />
            {router.pathname === AppRoutes.PAYMENT_CHART && (
              <SizeSelector
                value={size}
                onChange={setSize}
                style={{ fontWeight: 'normal' }}
              />
            )}
          </Space>
        </Flex>
      }
      style={{
        ...(isError && { borderColor: token.colorError }),
        // ...(!isFetching && isValid && { height: 528 + 58 }),
        ...style,
      }}
      className={className}
    >
      <Spin spinning={isFetching}>
        {!isValid ? (
          <Empty
            description={
              isFetching
                ? 'Завантаження...'
                : !companyId
                ? 'Оберіть компанію'
                : 'Неможливо відобразити графік'
            }
          />
        ) : (
          <Line data={chartData} {...chartConfig} />
        )}
      </Spin>
    </Card>
  )
}

const SizeSelector: React.FC<Omit<SelectProps, 'options' | 'mode'>> = ({
  loading,
  disabled,
  onChange,
  ...props
}) => {
  const options = useMemo(() => {
    return [
      { value: 10 },
      { value: 20 },
      { value: 30 },
      { value: 40 },
      { value: 50 },
    ]
  }, [])

  useEffect(() => {
    if (options?.length >= 1) {
      onChange?.(options[0].value, options[0])
    }
  }, [options, onChange])

  return (
    <Select
      options={options}
      disabled={options?.length === 1 || disabled}
      placeholder="Розмір..."
      onChange={onChange}
      {...props}
    />
  )
}

// TODO: to reusable components
const CompanySelector: React.FC<Omit<SelectProps, 'options' | 'mode'>> = ({
  status,
  loading,
  disabled,
  onChange,
  ...props
}) => {
  // TODO: replace with separated filter api later
  const {
    data: { realEstatesFilter: companies } = { realEstatesFilter: [] },
    isFetching,
    isError,
  } = useGetAllRealEstateQuery({ limit: 1 })

  const options = useMemo(() => {
    return companies?.map((company: IFilter) => ({
      label: company.text,
      value: company.value,
    }))
  }, [companies])

  useEffect(() => {
    if (options?.length >= 1) {
      onChange?.(options[0].value, options[0])
    }
  }, [options, onChange])

  return (
    <Select
      options={options}
      status={isError ? 'error' : status}
      loading={isFetching || loading}
      disabled={isFetching || isError || options?.length === 1 || disabled}
      placeholder="Оберіть компанію..."
      onChange={onChange}
      allowClear
      showSearch
      optionFilterProp="label"
      {...props}
    />
  )
}

export default PaymentsChart
