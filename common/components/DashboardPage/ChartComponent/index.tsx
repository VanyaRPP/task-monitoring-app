import { ExportOutlined } from '@ant-design/icons'
import {
  Card,
  Empty,
  Spin,
  Space,
  Button,
  Select,
  SelectProps,
  theme,
} from 'antd'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IFilter } from '@common/api/paymentApi/payment.api.types'

const Line = dynamic(
  () => import('@ant-design/plots').then(({ Line }) => Line),
  {
    ssr: false,
  }
)

interface ChartComponentProps {
  data: any[]
  config: any
  title: string
  link: string
  isFetching: boolean
  isError?: boolean
  placeholder?: string
  companyId?: string
  onCompanyChange?: (value: string) => void
  size?: number
  onSizeChange?: (value: number) => void
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  config,
  title,
  link,
  isFetching,
  isError,
  placeholder = 'Неможливо відобразити графік',
  companyId,
  onCompanyChange,
  size,
  onSizeChange,
}) => {
  const { token } = theme.useToken()

  const isValid = useMemo(() => {
    return !isError && data?.length > 0 && companyId
  }, [isError, data, companyId])

  console.log(data)

  return (
    <Card
      title={
        <Space>
          <Link href={link}>
            <Button type="link" icon={<ExportOutlined />}>
              {title}
            </Button>
          </Link>
          {onCompanyChange && (
            <CompanySelector
              value={companyId}
              onChange={onCompanyChange}
              style={{ width: 200, fontWeight: 'normal' }}/>
          )}
          {onSizeChange && (
            <SizeSelector
              value={size}
              onChange={onSizeChange}
              style={{ fontWeight: 'normal' }}/>
          )}
        </Space>
      }
      style={{
        ...(isError && { borderColor: token.colorError }),
      }}
    >
      <Spin spinning={isFetching}>
        {!isValid ? (
          <Empty
            description={
              isFetching
                ? 'Завантаження...'
                : !companyId
                  ? placeholder
                  : 'Неможливо відобразити графік'
            }
          />
        ) : (
          <Line data={data} {...config} />
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

export default ChartComponent
