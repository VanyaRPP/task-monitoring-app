import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import InvoicesHeader from '@common/components/Tables/PaymentsBulk/Header'
import InvoicesTable from '@common/components/Tables/PaymentsBulk/Table'
import TableCard from '@common/components/UI/TableCard'
import useService from '@common/modules/hooks/useService'
import { FormInstance, Form } from 'antd'
import { createContext, useContext } from 'react'

export const InvoicesPaymentContext = createContext(
  {} as {
    form: FormInstance,
    companies: IExtendedRealestate[],
    service: IExtendedService,
    isLoading: boolean,
    isError: boolean
  }
)

export const useInvoicesPaymentContext = () =>
  useContext(InvoicesPaymentContext)

const PaymentBulkBlock: React.FC = () => {
  const [form] = Form.useForm()

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

  return (
    <InvoicesPaymentContext.Provider
      value={{
        form,
        companies,
        service,
        isLoading: isCompaniesLoading || isServiceLoading,
        isError
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
