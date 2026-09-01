import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { buildBulkInvoiceMap } from '@common/components/Tables/PaymentsBulk/buildInvoiceMap'
import {
  buildTypedCustomColumn,
  getDefaultColumns,
  hasTypedColumn,
  resolveServiceType,
  withCompanyGate,
} from '@common/components/Tables/PaymentsBulk/column.config'
import { buildTypedInvoiceEntry } from '@common/components/Tables/PaymentsBulk/buildTypedInvoiceEntry'
import { resolvePrevReading } from '@common/components/Tables/PaymentsBulk/prevReading'
import { resolveTypedServiceTariff } from '@common/components/Tables/PaymentsBulk/typedServiceTariff'
import serviceFilter from '@components/AddPaymentModal/serviceFilter'
import { AppRoutes, Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { Alert, Empty, Form, InputNumber, Table } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { defaultServices } from '@utils/constants'
import { findPrevPaymentMatch } from './hooks/usePrevPayment/usePrevPayment'
import { Amount } from './cells/Amount'
import styles from './stylestable.module.scss'

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

  // Мемоїзація по відповіді, а не по `?? []`: інакше кожен рендер давав новий
  // масив -> нове paymentsValue -> setFieldsValue затирав уже введені показники.
  const allowedServices = useMemo(
    () => (customDomainServices?.data ?? []).flatMap((group) => group.services),
    [customDomainServices]
  )

  const customServicesColumns = useMemo(
    () =>
      allowedServices
        .filter((s) => !defaultServices.includes(s?._id.toString()))
        .map((s) => {
          // Key each custom column by the service _id, NOT fieldName: two
          // services whose names differ only in parentheses ("електрика(1)")
          // transliterate to the SAME fieldName and would otherwise share inputs.
          const key = String(s._id)

          // A typed custom service (e.g. serviceType === Electricity) renders
          // with the SAME builder as the native communal column of that type.
          // Untyped services keep the plain Кількість/Ціна pair. Either way the
          // cells only show on rows whose company actually uses the service.
          const gateOpts = { serviceKey: key, fieldName: s.fieldName }

          const typedColumn = buildTypedCustomColumn(s, {
            key,
            losses: service?.losses,
            // Тариф із місячної послуги — для підпису колонки. Індивідуальна
            // ціна компанії враховується вже в рядку кожної компанії.
            price: resolveTypedServiceTariff(
              { service },
              { serviceId: key, fieldName: s.fieldName }
            ),
          })
          if (typedColumn) return withCompanyGate(typedColumn, gateOpts)

          const genericColumn = {
            title: s.name,
            children: [
              {
                title: 'Кількість',
                width: 120,
                render: (_: any, { name }: { name: number }) => (
                  <Amount name={name} fieldName={key} />
                ),
              },
              {
                title: 'Ціна',
                width: 140,
                render: (_: any, { name }: { name: number }) => (
                  <Form.Item
                    name={[name, 'invoice', key, 'sum']}
                    style={{ margin: 0 }}
                  >
                    <InputNumber
                      placeholder="Ціна"
                      style={{ width: '100%' }}
                      min={0}
                    />
                  </Form.Item>
                ),
              },
            ],
          }
          return withCompanyGate(genericColumn, gateOpts)
        }),
    [allowedServices, service]
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

      const invoice = buildBulkInvoiceMap(allinvoice, filteredInvoice)

      for (const s of allowedServices) {
        if (defaultServices.includes(s?._id?.toString())) continue
        // Unique per-service key (see the columns above) — fieldName can collide.
        const key = String(s?._id ?? '')
        if (!key) continue

        const fieldKey = s.fieldName
        // getInvoices seeds a base custom entry keyed by fieldName; adopt it and
        // re-key to the unique _id, dropping the fieldName copy so a service is
        // never submitted twice.
        const existing =
          invoice[key] ?? (fieldKey ? invoice[fieldKey] : undefined)
        if (fieldKey && fieldKey !== key && invoice[fieldKey]) {
          delete invoice[fieldKey]
        }

        const base = {
          ...(existing || { type: 'custom' }),
          fieldName: fieldKey,
          name: s.name,
          serviceId: key,
        }

        const serviceType = resolveServiceType(s)

        if (hasTypedColumn(serviceType)) {
          // Reading-based type (e.g. electricity): carry over the previous
          // period's meter reading as this period's "Стара" — matched by the
          // stable serviceId (fieldName can collide), exactly like the native
          // electricity column. Загальне is recomputed by the cell.
          const prevReading = resolvePrevReading(validPrevPayment, {
            serviceId: key,
            fieldName: fieldKey,
          })

          invoice[key] = buildTypedInvoiceEntry({
            customService: s,
            serviceType,
            company,
            service,
            prevReading,
            base,
          }) as (typeof invoice)[string]
        } else {
          const amount = (existing as any)?.amount
          invoice[key] = {
            ...base,
            amount: amount === undefined || amount === null ? 1 : amount,
          } as (typeof invoice)[string]
        }
      }

      return {
        company,
        invoice,
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
          className={styles.customTable}
          bordered
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
