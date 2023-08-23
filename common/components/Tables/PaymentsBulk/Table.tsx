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

  const { service, isLoading: isServiceLoading } = useService({ serviceId })

  const isLoading = isCompaniesLoading || isServiceLoading

  const [dataSource, setDataSource] = useState([])

  useEffect(() => {
    if (!service || !companies) return setDataSource([])
    setDataSource(companies)
  }, [companies, service])

  const handleDelete = (_id: string) => {
    const newData = [...dataSource]
    setDataSource(newData.filter((item) => item._id !== _id))
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
      // TODO: blinking. add transition or delay before apearing
      dataSource={dataSource}
      scroll={{ x: 2000 }}
    />
  )
}

export default InvoicesTable
