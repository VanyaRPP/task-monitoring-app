/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { IGetInvoiceByTypeProps } from '../types'
import { toRoundFixed } from '@utils/helpers'
import { ServiceType } from '@utils/constants'

export const getCustomInvoices = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): Array<IPaymentField> => {
  return Object.values(currInvoicesCollection)
    .filter((invoice: IPaymentField) => invoice.type === ServiceType.Custom)
    .map((invoice) => ({
      name: invoice.name,
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    })
  )
}
