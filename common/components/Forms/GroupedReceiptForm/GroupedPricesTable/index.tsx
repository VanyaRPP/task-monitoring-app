import { usePaymentContext } from '@components/AddPaymentModal'
import { Table } from 'antd'
import { useMemo } from 'react'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import { ServiceType } from '@utils/constants'

export interface PaymentPricesTableProps {
  preview?: boolean
  domainId?: string
  currency?: string
  loading?: boolean
  invoices?: any[]
}

const getColumns = (currency?: string) => {
  const isUah = normalizeCurrency(currency) === 'UAH'
  const currencyLabel = getCurrencyShortLabel(currency)
  return [
    {
      title: isUah ? '№' : 'No.',
      dataIndex: 'key',
      key: 'key',
      width: 45,
    },
    {
      title: isUah ? 'Найменування послуги' : 'Service name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: isUah ? 'К-сть' : 'Quantity',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (value: any, record: any = {}) => {
        const n = Number(value)
        const type = record.type
        const displayValue = !isFinite(n) || n === 0 ? 1 : n
          
          if (type === ServiceType.Placing || type === 'rentPrice') {
            return `${displayValue.toFixed(2)} ${isUah ? 'м²' : 'm²'}`
          }
          if (type === ServiceType.Electricity || type === 'electricityPrice') {
            return `${displayValue.toFixed(2)} ${isUah ? 'кВт' : 'kWh'}`
          }
          if (type === ServiceType.Water || type === 'waterPrice' || type === 'waterPriceTotal') {
            return `${displayValue.toFixed(2)} ${isUah ? 'м³' : 'm³'}`
          }
          return displayValue
      },
    },
    {
      title: `${isUah ? 'Ціна' : 'Price'}, ${currencyLabel}`,
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (value: any, record: any = {}) => {
        const n = Number(value)
        if (!isFinite(n) || n === 0) return '-'
        const formatted = n.toFixed(2)
        const type = record.type

        if (type === ServiceType.Placing || type === 'rentPrice') {
          return `${formatted} ${currencyLabel}/${isUah ? 'м²' : 'm²'}`
        }
        if (type === ServiceType.Electricity || type === 'electricityPrice') {
          return `${formatted} ${currencyLabel}/${isUah ? 'кВт' : 'kWh'}`
        }
        if (type === ServiceType.Water || type === 'waterPrice' || type === 'waterPriceTotal') {
          return `${formatted} ${currencyLabel}/${isUah ? 'м³' : 'm³'}`
        }
        return formatted
      },
    },
    {
      title: `${isUah ? 'Сума' : 'Amount'}, ${currencyLabel}`,
      dataIndex: 'sum',
      key: 'sum',
      width: 120,
      render: (value: any) => {
        const n = Number(value)
        return isFinite(n) ? n.toFixed(2) : value
      },
    },
  ]
}

const GroupedPricesTable: React.FC<PaymentPricesTableProps> = ({
  currency,
  loading,
  invoices,
}) => {
  const { form, company } = usePaymentContext()
  const { domain } = form.getFieldsValue()

  const isEnglish = normalizeCurrency(currency || company?.currency || domain?.currency) !== 'UAH'

  const dataSource = useMemo(() => {
    return invoices
      ?.filter((inv) => Number(inv?.sum || 0) !== 0 || inv?.type === 'discount')
      .map((inv, index) => {
        let name = inv.name

        if (!name) {
          switch (inv.type) {
            case ServiceType.Maintenance:
              name = isEnglish ? 'Maintenance' : 'Утримання'
              break
            case ServiceType.Placing:
            case 'rentPrice':
              name = isEnglish ? 'Placing' : 'Розміщення'
              break
            case ServiceType.Inflicion:
              name = isEnglish ? 'Inflation' : 'Інфляція'
              break
            case ServiceType.Electricity:
            case 'electricityPrice':
              name = isEnglish ? 'Electricity' : 'Електроенергія'
              break
            case ServiceType.Water:
            case 'waterPrice':
            case 'waterPriceTotal':
              name = isEnglish ? 'Water supply' : 'Водопостачання'
              break
            case ServiceType.WaterPart:
              name = isEnglish ? 'Water supply share' : 'Частка водопостачання'
              break
            case ServiceType.GarbageCollector:
            case 'garbageCollectorPrice':
              name = isEnglish ? 'Garbage removal' : 'Вивіз ТПВ'
              break
            case ServiceType.Cleaning:
              name = isEnglish ? 'Cleaning' : 'Прибирання'
              break
            case ServiceType.Discount:
            case 'discount':
              name = isEnglish ? 'Discount' : 'Знижка'
              break
            case ServiceType.Custom:
              name = isEnglish ? 'Custom' : 'Власне'
              break
            default:
              name = inv.name || (isEnglish ? 'Additional' : 'Додатково')
          }
        }

        return {
          key: index + 1,
          name: name,
          sum: inv.sum,
          amount: inv.amount,
          price: inv.price,
          type: inv.type,
        }
      }) || []
  }, [invoices, isEnglish])

  return (
    <Table
      dataSource={dataSource}
      columns={getColumns(currency || company?.currency || domain?.currency)}
      loading={loading}
      pagination={false}
      bordered
    />
  )
}

export default GroupedPricesTable
