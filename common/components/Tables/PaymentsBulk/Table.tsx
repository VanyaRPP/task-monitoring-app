import { Alert, Form } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getPaymentsBulkDefaultColumns } from '@common/components/Tables/PaymentsBulk/columns.config'
import EditableTable from '@common/components/UI/EditableTable'
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

  const handleChange = (_, newValue, record) => {
    console.log(record)

    const newData = [...dataSource]
    const index = newData.findIndex((item) => item.key === record.key)
    const item = newData[index]
    newData.splice(index, 1, { ...item, ...newValue })
    setDataSource(newData)
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <EditableTable
      form={form}
      onSave={handleChange}
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
      columns={getPaymentsBulkDefaultColumns(service, handleDelete)}
      dataSource={dataSource}
      scroll={{ x: 1500 }}
    />
  )
}

export default InvoicesTable
