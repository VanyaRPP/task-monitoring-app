import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { Operations } from '@utils/constants'

interface IUseCompanyProps {
  companyId: any
  skip?: boolean
  type?: Operations
}

export function useCompanyInvoice({ companyId, skip, type=Operations.Debit }: IUseCompanyProps) {
  const { data: paymentsResponse, isLoading } = useGetAllPaymentsQuery(
    { companyIds: [companyId], limit: 1, type },
    { skip: !companyId || skip }
  )
  const lastInvoice = paymentsResponse?.data?.[0]
  return { lastInvoice, isLoading }
}