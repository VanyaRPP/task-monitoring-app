import { ExportOutlined } from '@ant-design/icons'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
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
  Form,
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
import { DomainPaymentsChart } from './DomainPaymentsChart'

interface IPaymentResponse {
  _id?: string
  invoiceCreationDate?: string
  generalSum?: number
  reciever?: { 
    companyName?: string 
  }
}

interface IRealEstateCompany {
  _id: string
  companyName: string
}

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
      skip: !companyId,
    }
  )

  const {
    data: { data: domainPayments } = { data: [] },
    isFetching: isFetchingDomain,
    isError: isErrorDomain,
  } = useGetAllPaymentsQuery({
    limit: size * 5,
    type: Operations.Debit,
  })

  const chartData = usePaymentsChartData(payments)
  const chartConfig = usePaymentsChartConfig()

  const isValid = useMemo(() => {
    return payments?.length > 0 && !!companyId && !isError
  }, [companyId, payments, isError])

  const domainChartData = useMemo(() => {
    if (!domainPayments || !Array.isArray(domainPayments)) return []

    const sortedPayments = [...(domainPayments as unknown as IPaymentResponse[])].sort(
      (a, b) => {
        const dateA = new Date(a?.invoiceCreationDate || 0).getTime()
        const dateB = new Date(b?.invoiceCreationDate || 0).getTime()
        return dateA - dateB
      }
    )

    return sortedPayments.map((payment) => {
      const rawDate = payment?.invoiceCreationDate

      let time = 'Невідомо'
      if (rawDate) {
        const parsedDate = new Date(rawDate)
        if (!isNaN(parsedDate.getTime())) {
          time = parsedDate.toLocaleDateString('uk-UA')
        }
      }

      const amount = Number(payment?.generalSum || 0)
      const companyName = payment?.reciever?.companyName || 'Невідома компанія'

      return {
        time,
        amount,
        companyName,
      }
    })
  }, [domainPayments])

  const isDarkModeActive = Boolean(
    String(token.colorText).includes('255') || 
    token.colorText === '#fff' || 
    token.colorTextBase === '#fff'
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Flex justify="space-between" align="center">
            <Space>
              <Link href={AppRoutes.PAYMENT_CHART}>
                <Button type="link" icon={<ExportOutlined />}>
                  Детальний графік компанії
                </Button>
              </Link>
              <CompanySelector
                value={companyId}
                onChange={setCompanyId}
                style={{ width: 200, fontWeight: 'normal' }}
              />
              {router.pathname === AppRoutes.PAYMENT_CHART && (
                <Form.Item label="Кількість платежів" style={{ margin: 0 }}>
                  <SizeSelector
                    value={size}
                    onChange={setSize}
                    style={{ fontWeight: 'normal' }}
                  />
                </Form.Item>
              )}
            </Space>
          </Flex>
        }
        style={{
          ...(isError && { borderColor: token.colorError }),
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

      <Card
        title={
          <Flex justify="space-between" align="center">
            <span style={{ fontWeight: 600, fontSize: '16px' }}>
              Зведена динаміка платежів по домену
            </span>
          </Flex>
        }
        style={{
          ...(isErrorDomain && { borderColor: token.colorError }),
          ...style,
        }}
        className={className}
      >
        <Spin spinning={isFetchingDomain}>
          {domainChartData.length === 0 && !isFetchingDomain ? (
            <Empty description="Немає даних по платежах домену" />
          ) : (
            <DomainPaymentsChart 
              data={domainChartData} 
              isDarkMode={isDarkModeActive}
              textColor={token.colorTextSecondary} 
            />
          )}
        </Spin>
      </Card>
    </Space>
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

const CompanySelector: React.FC<Omit<SelectProps, 'options' | 'mode'>> = ({
  status,
  loading,
  disabled,
  onChange,
  ...props
}) => {
  const {
    data: { data } = { data: [] },
    isFetching,
    isError,
  } = useGetAllRealEstateQuery({})

  const options = useMemo(() => {
    const companies =
      data.length !== 0
        ? data?.map((company: IRealEstateCompany) => {
            return {
              text: company.companyName,
              value: company._id,
            }
          })
        : []
    return companies?.map((company: { text: string; value: string }) => ({
      label: company.text,
      value: company.value,
    }))
  }, [data])

  useEffect(() => {
    if (options?.length >= 1 && !props.value) {
      onChange?.(options[0].value, options[0])
    }
  }, [options, onChange, props.value])

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