import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import {
  isMonthServicePlaceholder,
  parseMonthServicePlaceholder,
} from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import InvoicesHeader from '@common/components/Tables/PaymentsBulk/Header'
import InvoicesTable from '@common/components/Tables/PaymentsBulk/Table'
import TableCard from '@common/components/UI/TableCard'
import { Operations } from '@utils/constants'
import { Form, FormInstance } from 'antd'
import dayjs from 'dayjs'
import { createContext, useContext, useMemo } from 'react'

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

  const isPlaceholder = isMonthServicePlaceholder(serviceId)
  const placeholderDate = isPlaceholder
    ? parseMonthServicePlaceholder(serviceId)
    : null

  const {
    data: { data: companies } = { data: [] },
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
  } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !serviceId || !domainId || !streetId }
  )

  const {
    data: { data: { 0: realService } } = { data: [null] },
    isLoading: isServiceLoading,
    isError: isServiceError,
  } = useGetAllServicesQuery(
    { serviceId, limit: 1 },
    { skip: !serviceId || !domainId || !streetId || isPlaceholder }
  )

  const placeholderService = useMemo<IService | null>(() => {
    if (!isPlaceholder || !placeholderDate || !domainId || !streetId)
      return null
    return {
      _id: serviceId,
      date: placeholderDate.toDate(),
      domain: { _id: domainId },
      street: { _id: streetId },
      rentPrice: 0,
      electricityPrice: 0,
      waterPrice: 0,
      waterPriceTotal: 0,
      customServices: [],
    } as IService
  }, [isPlaceholder, placeholderDate, domainId, streetId, serviceId])

  const service = realService ?? placeholderService

  const previousServiceDate = service?.date
    ? dayjs(service.date).subtract(1, 'month')
    : null

  const {
    data: { data: { 0: prevService } } = { data: [null] },
    isLoading: isPrevServiceLoading,
    isError: isPrevServiceError,
  } = useGetAllServicesQuery(
    {
      streetId,
      domainId,
      month: previousServiceDate ? previousServiceDate.month() + 1 : undefined,
      year: previousServiceDate ? previousServiceDate.year() : undefined,
      limit: 1,
    },
    {
      skip:
        !serviceId ||
        !domainId ||
        !streetId ||
        !service ||
        !previousServiceDate,
    }
  )

  const {
    data: { data: prevPayments } = { data: [] },
    isLoading: isPrevPaymentsLoading,
    isError: isPrevPaymentsError,
  } = useGetAllPaymentsQuery(
    {
      streetIds: [streetId],
      domainIds: [domainId],
      companyIds: companies?.map(({ _id }) => _id),
      serviceIds: [prevService?._id],
      type: Operations.Debit,
      limit: companies?.length + 1,
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
