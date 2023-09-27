import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import moment from 'moment'

interface IUseCompanyProps {
  companyId: any
  skip?: boolean
}
interface IUseCompanyByDateProps {
  companyId: any
  skip?: boolean
  month?: number
  year?: number
}

export function useCompanyInvoice({ companyId, skip }: IUseCompanyProps) {
  const { data: paymentsResponse, isLoading } = useGetAllPaymentsQuery(
    { companyIds: [companyId], limit: 1 },
    { skip: skip }
  )
  const lastInvoice = paymentsResponse?.data?.[0]
  const date = {
    month: 8,
    year: 2023
  }
  const specifiedInvoice = paymentsResponse?.data?.map(item => {
    if(moment((item?.monthService as any)?.date).format('M YYYY') === `${date.month} ${date.year}`)
      return item
  })
  return { specifiedInvoice, lastInvoice, isLoading }
}

//TODO: Update to separate query

export function useCompanyInvoiceByDate({ companyId, skip, month, year }: IUseCompanyByDateProps) {
  const { data: paymentsResponse, isLoading } = useGetAllPaymentsQuery(
    { companyIds: [companyId], limit: 10 },
    { skip: skip || month < 1 || month > 12 }
  )
  const specifiedInvoice = paymentsResponse?.data?.find(item => moment((item?.monthService as any)?.date).format('M YYYY') == `${month} ${year}`)
  return { specifiedInvoice, isLoading }
}
