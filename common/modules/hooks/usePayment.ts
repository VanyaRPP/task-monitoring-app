import { useGetPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { Operations } from '@utils/constants'

interface IUseCompanyProps {
  companyId: any
  skip?: boolean
  type?: 'debit' | 'credit'
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
  const { data: paymentsResponse, isLoading } = useGetPaymentsQuery(
    { companyId, month, year, limit: 1, type },
    { skip: !companyId || skip }
  )
  const lastInvoice = paymentsResponse?.data?.[0]
  return { lastInvoice, isLoading }
}
