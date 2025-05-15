import {
  IPaymentField,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import { isEmpty, toRoundFixed, getPriceFromCustomServices } from '@utils/helpers'

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

export const getMaintenanceInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Maintenance]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Maintenance]
    const companyMaintenance =
      company?.customServices?.find(item => item?.fieldName === 'rentPrice')?.price >= 0
        ? company.customServices.find(item => item?.fieldName === 'rentPrice')!.price
        : company?.servicePricePerMeter >= 0
          ? company.servicePricePerMeter
          : undefined;

    return {
      type: invoice.type,
      amount: +toRoundFixed(invoice.amount),
      price:
        companyMaintenance !== undefined && companyMaintenance !== null
          ? +toRoundFixed(companyMaintenance)
          : +toRoundFixed(invoice.price),
      sum:
        companyMaintenance !== undefined && companyMaintenance !== null
          ? +toRoundFixed(companyMaintenance * +invoice.amount)
          : +toRoundFixed(+invoice.sum || +invoice.price * +invoice.amount),
    }
  }

  const rentPrice = getPriceFromCustomServices(company?.customServices, 'rentPrice')
  ??  getPriceFromCustomServices(service?.customServices, 'rentPrice')
  ?? company?.servicePricePerMeter
  ?? service?.rentPrice
  const totalArea = getPriceFromCustomServices(company?.customServices, 'totalArea') 
  ?? company?.totalArea

  if (
    !isNaN(totalArea) &&
    !isNaN(rentPrice)
  ) {

    return {
      type: ServiceType.Maintenance,
      amount: +toRoundFixed(totalArea),
      price: +toRoundFixed(rentPrice),
      sum: +toRoundFixed(
        totalArea * (rentPrice)
      ),
    }
  }
}