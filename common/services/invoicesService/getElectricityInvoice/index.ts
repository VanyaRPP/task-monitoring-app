import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { getPriceFromCustomServices } from '@utils/helpers'

export const getElectricityInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Electricity]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Electricity]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.price),
      amount: +toRoundFixed(+invoice.amount),
      lastAmount: +toRoundFixed(+invoice.lastAmount),
      sum: +toRoundFixed(
        +invoice.sum || +invoice.price * (+invoice.amount - +invoice.lastAmount)
      ),
    }
  }
  
  const electricityPrice = getPriceFromCustomServices(
    company?.customServices,
    ServiceType.Electricity
  )?? getPriceFromCustomServices(
    service?.customServices,
    ServiceType.Electricity
  ) ?? service?.electricityPrice

  if (!isEmpty(electricityPrice)) {
    const prevElectricity = prevInvoicesCollection[ServiceType.Electricity]

    return {
      type: ServiceType.Electricity,
      amount: +toRoundFixed(prevElectricity?.amount),
      lastAmount: +toRoundFixed(prevElectricity?.amount),
      price: +toRoundFixed(electricityPrice),
      sum: 0,
    }
  }
}
