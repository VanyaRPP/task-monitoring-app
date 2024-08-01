import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import InvoicesHeader from '@common/components/Tables/PaymentsBulk/Header'
import InvoicesTable from '@common/components/Tables/PaymentsBulk/Table'
import TableCard from '@common/components/UI/TableCard'
import { Form, FormInstance } from 'antd'
import dayjs from 'dayjs'
import { createContext, useContext } from 'react'

export const InvoicesPaymentContext = createContext<{
  form: FormInstance
  companies: IExtendedRealestate[]
  service: IService
  prevService: IService
  prevPayments: IExtendedPayment[]
  isLoading: boolean
  isError: boolean
}>({
  form: null,
  companies: [],
  service: null,
  prevService: null,
  prevPayments: [],
  isLoading: false,
  isError: false,
})

export const useInvoicesPaymentContext = () =>
  useContext(InvoicesPaymentContext)

const PaymentBulkBlock: React.FC = () => {
  const [form] = Form.useForm()

  const domainId: string | undefined = Form.useWatch('domain', form)
  const streetId: string | undefined = Form.useWatch('street', form)
  const serviceId: string | undefined = Form.useWatch('monthService', form)

  const {
    data: { data: companies } = { data: [] },
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
  } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !serviceId || !domainId || !streetId }
  )

  const {
    data: { data: { 0: service } } = { data: [null] },
    isLoading: isServiceLoading,
    isError: isServiceError,
  } = useGetAllServicesQuery(
    { serviceId, limit: 1 },
    { skip: !serviceId || !domainId || !streetId }
  )

  const {
    data: { data: { 0: prevService } } = { data: [null] },
    isLoading: isPrevServiceLoading,
    isError: isPrevServiceError,
  } = useGetAllServicesQuery(
    {
      streetId,
      domainId,
      month: dayjs(service?.date).month() - 1,
      year: dayjs(service?.date).year(),
      limit: 1,
    },
    { skip: !serviceId || !domainId || !streetId || !service }
  )

  const {
    data: { data: prevPayments } = { data: [] },
    isLoading: isPrevPaymentsLoading,
    isError: isPrevPaymentsError,
  } = useGetAllPaymentsQuery(
    {
      streetIds: [streetId],
      domainIds: [domainId],
      serviceIds: [prevService?._id],
      limit: companies?.length,
    },
    { skip: !serviceId || !domainId || !streetId || !prevService || !companies }
  )

  return (
    <InvoicesPaymentContext.Provider
      value={{
        form,
        companies: service && companies ? companies : undefined,
        service: service && companies ? service : undefined,
        prevService: service && companies ? prevService : undefined,
        prevPayments: service && companies ? prevPayments : undefined,
        isLoading:
          isCompaniesLoading ||
          isServiceLoading ||
          isPrevServiceLoading ||
          isPrevPaymentsLoading,
        isError:
          isCompaniesError ||
          isServiceError ||
          isPrevServiceError ||
          isPrevPaymentsError,
      }}
    >
      <Form form={form} layout="vertical">
        <TableCard title={<InvoicesHeader />}>
          <InvoicesTable />
        </TableCard>
      </Form>
    </InvoicesPaymentContext.Provider>
  )
}

export default PaymentBulkBlock
