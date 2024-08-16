import { dateToDayYearMonthFormat } from '@assets/features/formatDate'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'

export const getPaymentsChartData = (data: IExtendedPayment[]) => {
  const preparedData = data
    ? [...data]?.reverse()?.flatMap((payment) => {
        const date =
          (payment?.monthService as any)?.date || payment?.invoiceCreationDate

        const mappedValues = payment?.invoice
          .filter((item) =>
            Object.values(ServiceType).includes(item.type as ServiceType)
          )
          .map((item) => {
            const itemType =
              item.type === ServiceType.Water
                ? ServiceType.WaterPart
                : item.type
            return {
              date: dateToDayYearMonthFormat(date),
              value: +toRoundFixed(item.sum),
              category: paymentsTitle[itemType],
            }
          })
        return [...mappedValues]
      })
    : []
  return preparedData.sort(compareDates)
}

const compareDates = (a: any, b: any) => {
  const dateA = new Date(a.date.split('-').reverse().join('-'))
  const dateB = new Date(b.date.split('-').reverse().join('-'))

  return dateA.getTime() - dateB.getTime()
}
