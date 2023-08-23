import { Alert, Form, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import useService from '@common/modules/hooks/useService'
import { AppRoutes } from '@utils/constants'

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
    if (!service || !companies) return setDataSource([])

    setDataSource(
      companies.map((company) => ({
        ...company,
        old_elec: 0,
        new_elec: 0,
        sum_elec: 0,
        old_water: 0,
        new_water: 0,
        sum_water: 0,
        inflictionPrice: 0,
        garbageCollectorPrice: 0,
        discount: 0,
      }))
    )
  }, [companies, service])

  const handleDelete = (_id: string) => {
    const newData = [...dataSource]
    setDataSource(newData.filter((item) => item._id !== _id))
    // TODO: update on remote
  }

  const handleChange = (value, record, dataIndex) => {
    const newData = [...dataSource]
    const index = newData.findIndex((item) => item._id === record._id)
    const item = newData[index]
    newData.splice(index, 1, { ...item, [dataIndex]: value })
    setDataSource(newData)
  }

  const columns = getDefaultColumns(service, handleDelete, handleChange)

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
      // TODO: blinking. add transition or delay before apearing
      dataSource={dataSource}
      scroll={{ x: 1500 }}
    />
  )
}

export default InvoicesTable
