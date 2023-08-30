import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'

interface IUseCompanyProps {
  companyId: any
  skip?: boolean
}

export function useCompanyInvoice({ companyId, skip }: IUseCompanyProps) {
  const { data: paymentsResponse, isLoading } = useGetAllPaymentsQuery(
    { companyIds: [companyId], limit: 1 },
    { skip: skip }
  )
  const company = paymentsResponse?.data?.[0]
  return { company, isLoading }
}
