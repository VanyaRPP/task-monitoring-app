import { IExtendedPayment, IPayment, IPaymentTransactions } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { Operations } from '@utils/constants'

export function buildCreditFromDebit(source: IExtendedPayment, invoiceNumber: number): IPayment {
  const company =
    typeof source.company === 'string' ? null : (source.company as Partial<IRealestate>)

  const transaction: IPaymentTransactions = {
    AUT_CNTR_ACC: source.transaction?.AUT_CNTR_ACC || company?.account || '',
    AUT_CNTR_NAM: source.transaction?.AUT_CNTR_NAM || company?.companyName || '',
    AUT_CNTR_MFO: source.transaction?.AUT_CNTR_MFO || '',
    Description: source.transaction?.Description || source.description || '',
  }

  const monthService =
    typeof source.monthService === 'string' ? source.monthService : source.monthService?._id

  return {
    invoiceNumber,
    type: Operations.Credit,
    domain: source.domain,
    street: source.street,
    company: source.company,
    monthService,
    invoiceCreationDate: new Date(),
    generalSum: source.generalSum,
    provider: source.provider,
    reciever: source.reciever,
    transaction,
    invoice: [],
  }
}
