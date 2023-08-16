import { CloseCircleOutlined } from '@ant-design/icons'
import { Button, Form, Table } from 'antd'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import useService from '@common/modules/hooks/useService'

const InvoicesTable: React.FC = () => {
  const { form } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const { data: companies } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !domainId || !streetId }
  )

  const { service } = useService({
    domainId,
    streetId,
    serviceId,
  })

  return (
    <Table
      columns={getDefaultColumnsColumns(service)}
      dataSource={companies}
      bordered
      size="small"
      rowKey="_id"
      scroll={{ y: 800 }}
    />
  )
}

export default InvoicesTable

const getDefaultColumnsColumns = (service?: any) => {
  return [
    {
      title: 'Компанія',
      dataIndex: 'companyName',
    },
    {
      title: 'Площа (м²)',
      dataIndex: 'totalArea',
    },
    {
      title: 'Утримання',
      dataIndex: 'servicePricePerMeter',
      render: (__, obj) => {
        const prioPrice = obj.servicePricePerMeter || service?.rentPrice
        return prioPrice * obj.totalArea
      },
    },
    {
      title: 'Розміщення',
      dataIndex: 'pricePerMeter',
      render: (__, obj) => obj.pricePerMeter * obj.totalArea,
    },
    {
      title: 'Електрика',
      children: [
        {
          title: 'Стара',
        },
        {
          title: 'Нова',
        },
      ],
    },
    {
      title: 'Вода',
      children: [
        {
          title: 'Стара',
        },
        {
          title: 'Нова',
        },
      ],
    },
    {
      title: 'Індекс інфляції',
      dataIndex: 'inflicion',
      render: (value = 1) => `${((value - 1) * 100).toFixed(2)}%`,
    },
    {
      title: 'ТПВ',
    },
    {
      title: 'Знижка',
      dataIndex: 'discount',
      render: (value = 0) => `${(value * 100).toFixed(0)}%`,
    },
    {
      title: '',
      render: () => (
        <Button type="text">
          <CloseCircleOutlined />
        </Button>
      ),
    },
  ]
}
