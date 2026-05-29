import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { buildBulkInvoiceMap } from '@common/components/Tables/PaymentsBulk/buildInvoiceMap'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import serviceFilter from '@components/AddPaymentModal/serviceFilter'
import { AppRoutes, Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { Alert, Empty, Form, Input, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { defaultServices } from '@utils/constants'
import { findPrevPaymentMatch } from './hooks/usePrevPayment/usePrevPayment'

const InvoicesTable: React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PAYMENT_BULK

  const {
    form,
    service,
    companies,
    prevPayments,
    prevService,
    isLoading,
    isError,
  } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId },
    { skip: !domainId }
  )

  const groups = customDomainServices?.data ?? []

  const allowedServices = useMemo(
    () => groups.flatMap((group) => group.services),
    [groups]
  )

  const customServicesColumns = useMemo(
    () =>
      allowedServices
        .filter((s) => !defaultServices.includes(s?._id.toString()))
        .map((s) => ({
          title: s.name,
          width: 160,
          render: (_: any, { name }: { name: number }) => (
            <Form.Item
              name={[name, 'invoice', s.fieldName, 'sum']}
              style={{ margin: 0 }}
            >
              <Input />
            </Form.Item>
          ),
        })),
    [allowedServices]
  )

  const paymentsValue = useMemo(() => {
    if (!companies || companies.length === 0 || !service) return []

    return companies.map((company) => {
      const prevPayment = findPrevPaymentMatch(prevPayments, {
        companyId: company._id,
        serviceId: prevService?._id,
        streetId: prevService?.street?._id,
        domainId: prevService?.domain?._id,
      })

      const validPrevPayment =
        prevPayment?.type === Operations.Debit ? prevPayment : undefined

      const allinvoice = getInvoices({
        company,
        service,
        prevService,
        prevPayment: validPrevPayment,
      })

      const filteredInvoice = serviceFilter(allinvoice, allowedServices)

      return {
        company,
        invoice: buildBulkInvoiceMap(allinvoice, filteredInvoice),
      }
    })
  }, [companies, service, prevService, prevPayments, allowedServices])

  useEffect(() => {
    if (!companies || companies.length === 0 || !service) {
      form.setFieldsValue({ payments: [] })
      return
    }

    form.setFieldsValue({ payments: paymentsValue })
  }, [form, companies, service, paymentsValue])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="payments">
      {(fields, { remove }) => (
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          loading={isLoading}
          tableLayout="fixed"
          columns={[
            ...getDefaultColumns(
              remove,
              allowedServices,
              service?.losses,
              customServicesColumns
            ),
          ]}
          dataSource={fields}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty description="За даною адресою послуг не знайдено!" />
            ),
          }}
        />
      )}
    </Form.List>
  )
}

export default InvoicesTable
