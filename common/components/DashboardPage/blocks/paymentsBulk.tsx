import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import InvoicesHeader from '@common/components/Tables/PaymentsBulk/Header'
import InvoicesTable from '@common/components/Tables/PaymentsBulk/Table'
import TableCard from '@common/components/UI/TableCard'
import { Form, FormInstance } from 'antd'
import { createContext, useContext } from 'react'

export const InvoicesPaymentContext = createContext(
  {} as {
    form: FormInstance
    companies: IExtendedRealestate[]
    service: IService
    isLoading: boolean
    isError: boolean
  }
)

export const useInvoicesPaymentContext = () =>
  useContext(InvoicesPaymentContext)

const PaymentBulkBlock: React.FC = () => {
  const [form] = Form.useForm()

  const domainId: string | undefined = Form.useWatch('domain', form)
  const streetId: string | undefined = Form.useWatch('street', form)
  const serviceId: string | undefined = Form.useWatch('monthService', form)

  const { data: { 0: domain } = [null], isLoading: isDomainLoading } =
    useGetDomainsQuery({ domainId }, { skip: !domainId })

  const {
    data: { data: companies } = { data: [] },
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
  } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: !domainId || !streetId }
  )

  const {
    data: { data: { 0: service } } = { data: [null] },
    isLoading: isServiceLoading,
    isError: isServiceError,
  } = useGetAllServicesQuery({ serviceId, limit: 1 }, { skip: !serviceId })

  return (
    <InvoicesPaymentContext.Provider
      value={{
        form,
        companies: domainId && streetId ? companies : [],
        service: serviceId === service?._id ? service : undefined,
        isLoading: isCompaniesLoading || isServiceLoading,
        isError: isCompaniesError || isServiceError,
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
