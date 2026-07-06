import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import { isNewEntityValue } from '@utils/inlineCreate'
import {
  catalogRowToSelectOption,
  flattenDomainCatalogServices,
  IInvoiceLineAddPayload,
  IInvoicePriceContext,
  invoiceLineExcludeKey,
} from '@utils/domain/domain-invoice-selector'
import { Empty, Form, FormInstance, Select, Table } from 'antd'
import React, { useCallback, useMemo } from 'react'

import Cleaning from './Cleaning'
import Custom from './Custom'
import Discount from './Discount'
import Electricity from './Electricity'
import GarbageCollector from './GarbageCollector'
import Inflicion from './Inflicion'
import Maintenance from './Maintenance'
import Placing from './Placing'
import Water from './Water'
import WaterPart from './WaterPart'

export interface TableProps {
  form?: FormInstance
  service?: IService
  company?: IRealestate
  prevPayment?: IPayment
  domainId?: string
  editable?: boolean
  disabled?: boolean

  extended?: boolean
  expandable?: boolean
  filterable?: boolean
  selectable?: boolean

  loading?: boolean

  selected?: string[]
  onSelect?: (items: string[]) => void
  onDelete?: (item: string) => void

  className?: string
  style?: React.CSSProperties
}

export type EditInvoicesTableProps = Omit<
  TableProps,
  'filterable' | 'extended' | 'expandable'
>
export type InvoiceType = IPayment['invoice'][0]

export interface InvoiceComponentProps {
  form?: FormInstance
  name?: string | string[] | number | number[]
  editable?: boolean
  disabled?: boolean
  record?: InvoiceType
}

export const EditInvoicesTable_unstable: React.FC<EditInvoicesTableProps> = ({
  form: _form,
  editable = false,
  disabled = false,
  loading = false,
  service,
  company,
  prevPayment,
  domainId,
  ...props
}) => {
  const [form] = Form.useForm(_form)
  const invoices: InvoiceType[] = Form.useWatch('invoice', form) || []

  return (
    <Form.List name="invoice">
      {(fields, { add, remove }) => {
        const columns = [
          {
            title: '№',
            width: 50,
            render: (_: any, __: any, index: number) => index + 1,
          },
          {
            title: 'Назва',
            width: 400,
            render: (_: any, { name }: { name: number }) => (
              <Name
                form={form}
                name={name}
                record={invoices[name]}
                editable={editable}
                disabled={disabled}
              />
            ),
          },
          {
            title: 'Кількість',
            width: 250,
            render: (_: any, { name }: { name: number }) => (
              <Amount
                form={form}
                name={name}
                record={invoices[name]}
                editable={editable}
                disabled={disabled}
              />
            ),
          },
          {
            title: `Ціна ${
              invoices?.some((invoice) => invoice?.isIndividual)
                ? '(індивідуальна)'
                : ''
            }`,
            width: 250,
            render: (_: any, { name }: { name: number }) => (
              <Price
                form={form}
                name={name}
                record={invoices[name]}
                editable={editable}
                disabled={disabled}
              />
            ),
          },
          {
            title: 'Сума',
            width: 200,
            render: (_: any, { name }: { name: number }) => (
              <Sum
                form={form}
                name={name}
                record={invoices[name]}
                editable={editable}
                disabled={disabled}
              />
            ),
          },
          {
            width: 50,
            render: (_: any, record: { name: number }) => (
              <MinusCircleOutlined
                onClick={() => !disabled && remove(record.name)}
                style={{ opacity: disabled ? 0.5 : 1, fontSize: 16 }}
              />
            ),
            hidden: !editable,
          },
        ].filter((column) => !column.hidden)

        return (
          <Table
            rowKey="name"
            loading={loading}
            size="small"
            dataSource={fields}
            pagination={false}
            locale={
              editable
                ? {
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span
                            style={{
                              maxWidth: 360,
                              display: 'inline-block',
                            }}
                          >
                            Ще немає послуг. Додайте рядок нижче: оберіть з
                            каталогу або «Власне», вкажіть назву, кількість і
                            ціну — сума порахується автоматично (ціна ×
                            кількість).
                          </span>
                        }
                      />
                    ),
                  }
                : undefined
            }
            footer={
              editable
                ? () => (
                    <InvoiceSelector
                      service={service}
                      company={company}
                      prevPayment={prevPayment}
                      domainId={domainId}
                      excludeKeys={
                        invoices?.map((inv) => invoiceLineExcludeKey(inv)) ?? []
                      }
                      onSelect={(payload) => add(payload)}
                    />
                  )
                : null
            }
            scroll={{ x: 750 }}
            columns={columns}
            {...props}
          />
        )
      }}
    </Form.List>
  )
}

export const InvoiceSelector: React.FC<{
  service?: IService
  company?: IRealestate
  prevPayment?: IPayment
  domainId?: string
  excludeKeys?: string[]
  onSelect?: (payload: IInvoiceLineAddPayload) => void
}> = ({ service, company, prevPayment, domainId, excludeKeys, onSelect }) => {
  const rawDomainId = service?.domain?._id
    ? String(service.domain._id)
    : domainId
      ? String(domainId)
      : undefined

  const isNewDomain = isNewEntityValue(rawDomainId)
  const catalogDomainId = isNewDomain ? undefined : rawDomainId
  const hasDomainContext = !!rawDomainId

  const { data: catalogRes, isLoading } = useGetCustomServicesByDomainQuery(
    { domainId: catalogDomainId ? [catalogDomainId] : undefined },
    { skip: !catalogDomainId }
  )

  const options = useMemo(() => {
    if (!hasDomainContext) return []
    const groups = catalogDomainId ? (catalogRes?.data ?? []) : []
    const rows = flattenDomainCatalogServices(groups)
    const priceContext: IInvoicePriceContext = {
      company,
      service,
      prevPayment,
    }
    const catalogOptions = rows
      .map((row) => catalogRowToSelectOption(row, priceContext))
      .filter((opt) => !excludeKeys?.includes(opt.value))
    const customOption = {
      value: ServiceType.Custom,
      label: 'Власне',
      payload: { type: ServiceType.Custom },
    }
    return [...catalogOptions, customOption]
  }, [
    catalogRes,
    catalogDomainId,
    hasDomainContext,
    excludeKeys,
    company,
    service,
    prevPayment,
  ])

  const handleSelect = useCallback(
    (value: string) => {
      if (value === ServiceType.Custom) {
        onSelect?.({ type: ServiceType.Custom })
        return
      }
      const opt = options.find((o) => o.value === value)
      if (!opt || excludeKeys?.includes(opt.value)) return
      onSelect?.(opt.payload)
    },
    [excludeKeys, onSelect, options]
  )

  return (
    <Select
      style={{ width: '100%' }}
      suffixIcon={<PlusOutlined />}
      placeholder={
        hasDomainContext
          ? 'Додати поле з каталогу домену...'
          : 'Немає домену в сервісі — каталог недоступний'
      }
      onSelect={handleSelect}
      value={undefined}
      options={options}
      loading={!!catalogDomainId && isLoading}
      disabled={!hasDomainContext || (!!catalogDomainId && isLoading)}
      allowClear
      showSearch
      optionFilterProp="label"
      notFoundContent={
        catalogDomainId && !isLoading
          ? 'У групах домену немає послуг'
          : undefined
      }
    />
  )
}

const Name: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="name" {...props} />
}
const Amount: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="amount" {...props} />
}
const Price: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="price" {...props} />
}
const Sum: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="sum" {...props} />
}

const ComponentsCollection: {
  [key in ServiceType | string]: {
    Name: React.FC<InvoiceComponentProps>
    Amount: React.FC<InvoiceComponentProps>
    Price: React.FC<InvoiceComponentProps>
    Sum: React.FC<InvoiceComponentProps>
  }
} = {
  [ServiceType.Maintenance]: Maintenance,
  [ServiceType.Placing]: Placing,
  [ServiceType.Inflicion]: Inflicion,
  [ServiceType.GarbageCollector]: GarbageCollector,
  [ServiceType.Electricity]: Electricity,
  [ServiceType.Water]: Water,
  [ServiceType.WaterPart]: WaterPart,
  [ServiceType.Cleaning]: Cleaning,
  [ServiceType.Discount]: Discount,
  [ServiceType.Custom]: Custom,
}

type ColumnKey = 'name' | 'amount' | 'price' | 'sum'

const COLUMN_TO_SLOT: Record<ColumnKey, 'Name' | 'Amount' | 'Price' | 'Sum'> = {
  name: 'Name',
  amount: 'Amount',
  price: 'Price',
  sum: 'Sum',
}

const Component: React.FC<InvoiceComponentProps & { type: ColumnKey }> = ({
  form,
  name,
  type,
  record,
  ...props
}) => {
  if (!record) return null

  const components =
    ComponentsCollection[record.type] ||
    ComponentsCollection[ServiceType.Custom]

  const C = components?.[COLUMN_TO_SLOT[type]]
  if (!C) return null

  return <C form={form} name={name} record={record} {...props} />
}
