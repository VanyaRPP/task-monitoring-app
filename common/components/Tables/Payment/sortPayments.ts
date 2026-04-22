import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'

export function sortPayments(payments: IExtendedPayment[]): IExtendedPayment[] {
  return [...payments].sort((a, b) => {
    const dateA = new Date(a.invoiceCreationDate as unknown as string).getTime()
    const dateB = new Date(b.invoiceCreationDate as unknown as string).getTime()

    if (dateB !== dateA) {
      return dateB - dateA
    }

    if (a.type === Operations.Credit && b.type === Operations.Debit) return -1
    if (a.type === Operations.Debit && b.type === Operations.Credit) return 1

    return 0
  })
}
