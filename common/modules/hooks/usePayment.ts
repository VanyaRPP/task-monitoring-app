import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { Operations } from '@utils/constants'

interface IUseCompanyProps {
  companyId: any
  skip?: boolean
  type?: Operations
  month?: number
  year?: number
}

export function useCompanyInvoice({
  companyId,
  month,
  year,
  skip,
  type = Operations.Debit,
}: IUseCompanyProps) {
  const { data: paymentsResponse, isLoading } = useGetAllPaymentsQuery(
    { companyIds: [companyId], month, year, limit: 1, type },
    { skip: !companyId || skip }
  )
  const lastInvoice = paymentsResponse?.data?.[0]
  return { lastInvoice, isLoading }
}
