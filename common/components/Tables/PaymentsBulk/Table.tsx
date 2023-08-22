import { CloseCircleOutlined } from '@ant-design/icons'
import { Alert, Form, Input, Popconfirm, Table, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import useService from '@common/modules/hooks/useService'
import { AppRoutes } from '@utils/constants'
import style from './paymentBulk.module.scss'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const { form } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const {
    data: companies,
    isLoading: isCompaniesLoading,
    isError,
  } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !domainId || !streetId }
  )

  const { service, isLoading: isServiceLoading } = useService({
    domainId,
    streetId,
    serviceId,
  })

  const isLoading = isCompaniesLoading || isServiceLoading

  const [dataSource, setDataSource] = useState([])

  useEffect(() => {
    setDataSource(
      companies?.map((company, index) => ({
        key: index.toString(),
        ...company,
      }))
    )
  }, [companies])

  const handleDelete = (key: string) => {
    const newData = [...dataSource]
    setDataSource(newData.filter((item) => item.key !== key))
    // TODO: update on remote
  }

  const columns = getDefaultColumns(service, handleDelete)

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        !isOnPage && {
          responsive: false,
          size: 'small',
          pageSize: 8,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }
      }
      loading={isLoading}
      columns={columns}
      // TODO: blinking. add transitaion or delay before apearing
      dataSource={serviceId && !isLoading ? dataSource : []}
      scroll={{ x: 1500 }}
    />
  )
}

export default InvoicesTable

function FormAttribute({
  disabled,
  value,
  name,
}: {
  disabled?: boolean
  value: any
  name: any
}) {
  const { form } = useInvoicesPaymentContext()

  useEffect(() => {
    form.setFieldValue(name, value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <Form.Item name={name}>
      <Input disabled={disabled} />
    </Form.Item>
  )
}

const getDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void
): any[] => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 200,
    render: (value, obj) => (
      <FormAttribute
        disabled
        name={['companies', obj.companyName, 'companyName']}
        value={value}
      />
    ),
  },
  {
    title: 'Площа (м²)',
    dataIndex: 'totalArea',
    render: (value, obj) => (
      <FormAttribute
        name={['companies', obj.companyName, 'totalArea']}
        value={value}
      />
    ),
  },
  {
    title: 'Утримання',
    children: [
      {
        title: 'За м²',
        dataIndex: 'servicePricePerMeter',
        render: (__, obj) => (
          <div className={style.inlineRow}>
            <FormAttribute
              name={['companies', obj.companyName, 'maintenancePrice', 'price']}
              value={obj.servicePricePerMeter || service?.rentPrice}
            />
            {obj.servicePricePerMeter && (
              <Tooltip title="індивідуальне утримання, що передбачене договором">
                <QuestionCircleOutlined />
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'pricePerMeter',
        render: (__, obj) => {
          const prioPrice = obj.servicePricePerMeter || service?.rentPrice
          return (
            <FormAttribute
              disabled
              name={['companies', obj.companyName, 'maintenancePrice', 'sum']}
              value={prioPrice * obj.totalArea}
            />
          )
        },
      },
    ],
  },
  {
    title: 'Розміщення',
    children: [
      {
        title: 'За м²',
        dataIndex: 'pricePerMeter',
        render: (__, obj) => (
          <FormAttribute
            name={['companies', obj.companyName, 'placingPrice', 'price']}
            value={obj.pricePerMeter}
          />
        ),
      },
      {
        title: 'Загальне',
        render: (__, obj) => (
          <FormAttribute
            disabled
            name={['companies', obj.companyName, 'placingPrice', 'sum']}
            value={obj.pricePerMeter * obj.totalArea}
          />
        ),
      },
    ],
  },
  {
    title: 'Електрика',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_elec',
        editable: true,
      },
      {
        title: 'Нова',
        dataIndex: 'new_elec',
        editable: true,
      },
    ],
  },
  {
    title: 'Вода',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_water',
        editable: true,
      },
      {
        title: 'Нова',
        dataIndex: 'new_water',
        editable: true,
      },
    ],
  },
  {
    title: 'Індекс інфляції',
    dataIndex: 'tmp_1',
    editable: true,
  },
  {
    title: 'ТПВ',
    dataIndex: 'tmp_2',
    editable: true,
  },
  {
    title: 'Знижка',
    dataIndex: 'tmp_3',
    editable: true,
  },
  {
    fixed: 'right',
    align: 'center',
    title: '',
    dataIndex: '',
    width: 50,
    render: (_, record: { key: React.Key }) => (
      <Popconfirm
        title="Видалити запис?"
        onConfirm={() => handleDelete && handleDelete(record.key)}
      >
        <CloseCircleOutlined />
      </Popconfirm>
    ),
  },
]

export interface DataType {
  key: React.Key
  [key: string]: any
}
