import { CloseCircleOutlined } from '@ant-design/icons'
import { Alert, Form, Popconfirm, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import useService from '@common/modules/hooks/useService'
import { AppRoutes } from '@utils/constants'

import { EditableCell } from '@common/components/UI/EditableCell'
import { EditableRow } from '@common/components/UI/EditableRow'

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
        servicePricePerMeter:
          company.servicePricePerMeter || service?.rentPrice,
        ...company,
      }))
    )
  }, [companies])

  const handleDelete = (key: string) => {
    const newData = [...dataSource]
    setDataSource(newData.filter((item) => item.key !== key))
    // TODO: update on remote
  }

  // const handleChange = (value) => {
  //   const newData = [...dataSource]
  //   const index = newData.findIndex((item) => item.key === value.key)
  //   const item = newData[index]
  //   newData.splice(index, 1, { ...item, ...value })
  //   setDataSource(newData)
  // }

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }

  const columns = transformColumnsToEditable(
    getDefaultColumns(service, handleDelete)
  )

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
      components={components}
      dataSource={dataSource}
      scroll={{ x: 1500 }}
    />
  )
}

export default InvoicesTable

const getDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void
): any[] => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 200,
  },
  {
    title: 'Площа (м²)',
    dataIndex: 'totalArea',
  },
  {
    title: 'Утримання',
    children: [
      {
        title: 'За м²',
        dataIndex: 'servicePricePerMeter',
        render: (_, obj) => obj.servicePricePerMeter || service?.rentPrice,
        editable: true,
      },
      {
        title: 'Загальне',
        dataIndex: 'servicePrice',
        render: (_, obj) => {
          const prioPrice = obj.servicePricePerMeter || service?.rentPrice
          return prioPrice * obj.totalArea
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
        editable: true,
      },
      {
        title: 'Загальне',
        dataIndex: 'price',
        render: (_, obj) => obj.pricePerMeter * obj.totalArea,
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

const getEditableColumn = (column) => ({
  ...column,
  onCell: (record) => ({
    record,
    editable: column.editable,
    dataIndex: column.dataIndex,
    title: column.title,
  }),
})

const transformColumnsToEditable = (columns: any[]): any[] => {
  return [...columns].map((column) =>
    'children' in column
      ? { ...column, children: transformColumnsToEditable(column.children) }
      : getEditableColumn(column)
  )
}
