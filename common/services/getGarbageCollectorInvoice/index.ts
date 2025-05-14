import {
  IPaymentField,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import { isEmpty, toRoundFixed } from '@utils/helpers'

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

export const getGarbageCollectorInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.GarbageCollector]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.GarbageCollector]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  const serviceGarbageCollectorPrice = service?.customServices?.find(item => item?.fieldName === 'garbageCollectorPrice')?.price ?? 
  service?.garbageCollectorPrice

  const companyRentPart = company?.customServices?.find(item => item?.fieldName === 'rentPart')?.price || 
  company?.rentPart

  if (!isEmpty(serviceGarbageCollectorPrice) && 
    !isNaN(serviceGarbageCollectorPrice) && 
    company?.garbageCollector) 
    {
      const price = serviceGarbageCollectorPrice * (companyRentPart / 100)

    return {
      type: ServiceType.GarbageCollector,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
}