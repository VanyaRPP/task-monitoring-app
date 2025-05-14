import {
  IPayment,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'

export type InvoicesCollection = {
  [key in ServiceType | string]?: IPaymentField
}

export interface IGetInvoiceProps {
  company?: Partial<IRealestate>
  service?: Partial<IService>
  payment?: Partial<IPayment>
  prevService?: Partial<IService>
  prevPayment?: Partial<IPayment>
}

export interface IGetInvoiceByTypeProps {
  company?: Partial<IRealestate>
  service?: Partial<IService>
  prevService?: Partial<IService>
  currInvoicesCollection: InvoicesCollection
  prevInvoicesCollection: InvoicesCollection
}
