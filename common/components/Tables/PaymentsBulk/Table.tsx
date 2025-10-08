import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { getDefaultColumns } from '@common/components/Tables/PaymentsBulk/column.config'
import serviceFilter from '@components/AddPaymentModal/serviceFilter'
import { AppRoutes, Operations } from '@utils/constants'
import { getInvoices } from '@common/services/invoicesService'
import { Alert, Empty, Form, Input, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

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
  const allowedServices = groups.flatMap((group) => group.services)

  const excludedFields = [
    'electricityPrice',
    'cleaningPrice',
    'rentPart',
    'inflicionPrice',
    'waterPrice',
    'waterPart',
    'waterPriceTotal',
    'rentPrice',
    'znyzhka',
    'placingPrice',
  ]

  const dynamicColumns = useMemo(() => {
    return allowedServices
      .filter((service) => !excludedFields.includes(service?.fieldName))
      .map((svc) => ({
        title: svc.name,
        width: 160,
        render: (_: any, { name }: { name: number }) => (
          <Form.Item
            name={[name, 'invoice', svc.fieldName, 'sum']}
            style={{ margin: 0 }}
          >
            <Input />
          </Form.Item>
        ),
      }))
  }, [allowedServices])
  useEffect(() => {
    if (!companies || companies.length === 0 || !service) {
      return form.setFieldsValue({ payments: [] })
    }

    form.setFieldsValue({
      payments: companies?.map((company) => {
        const prevPayment = prevPayments?.find(
          (payment) =>
            // TODO: fix typing of IPayment and IExtendedPayment
            // eslint-disable-next-line
            // @ts-ignore
            payment.company?._id === company._id &&
            payment.type === Operations.Debit
        )

        const allinvoice = getInvoices({
          company,
          service,
          prevService,
          prevPayment,
        })
        const filteredInvoice = serviceFilter(allinvoice, allowedServices)

        const invoiceObjectForTheAll = allinvoice.reduce((acc, inv) => {
          acc[inv.name || inv.type] = inv
          return acc
        }, {} as Record<string, any>)

        const invoiceObjectForCustom = filteredInvoice.reduce((acc, inv) => {
          acc[inv.fieldName || inv.type] = inv
          return acc
        }, {} as Record<string, any>)

        const invoiceObject = {
          ...invoiceObjectForTheAll,
          ...invoiceObjectForCustom,
        }

        return {
          company,
          invoice: invoiceObject,
        }
      }),
    })
  }, [form, service, companies, prevService, prevPayments, allowedServices])

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Form.List name="payments">
      {(fields, { remove }) => (
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          loading={isLoading}
          columns={[
            ...getDefaultColumns(
              remove,
              allowedServices,
              service?.losses,
              dynamicColumns
            ),
          ]}
          dataSource={fields}
          scroll={{ x: 3000 }}
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
