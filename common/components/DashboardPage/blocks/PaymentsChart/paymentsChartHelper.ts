import { IExtendedPayment } from "@common/api/paymentApi/payment.api.types";
import { dateToDayYearMonthFormat } from "@common/assets/features/formatDate";
import { ServiceType, paymentsTitle } from "@utils/constants";

export const getPaymentsChartData = (data: IExtendedPayment[]) => {
  const preparedData = data
    ? [...data]?.reverse()?.flatMap((payment) => {
      const date = (payment?.monthService as any)?.date || payment?.invoiceCreationDate

        const mappedValues = payment?.invoice
          .filter(item => filterValues.includes(item.type as ServiceType))
          .map(item => {
            const itemType = item.type === ServiceType.Water ? ServiceType.WaterPart : item.type
            return {
              date: dateToDayYearMonthFormat(date),
              value: +item.sum,
              category: paymentsTitle[itemType] ,
            }
          })

        const generalSumValue = {
          date: dateToDayYearMonthFormat(date),
          value: +payment?.generalSum,
          category: paymentsTitle.generalSum,
        }

        return [
          ...(mappedValues),
          ...([generalSumValue]),
        ]
      })
    : []
  return preparedData.sort(compareDates)
}

const compareDates = (a: any, b: any) => {
  const dateA = new Date(a.date.split('-').reverse().join('-'));
  const dateB = new Date(b.date.split('-').reverse().join('-'));

  return dateA.getTime() - dateB.getTime();
};

const filterValues = [
  ServiceType.Placing,
  ServiceType.Inflicion,
  ServiceType.Electricity,
  ServiceType.GarbageCollector,
  ServiceType.Water,
  ServiceType.WaterPart,
  ServiceType.Maintenance,
]

export const chartConfig = {
  xField: 'date',
  yField: 'value',
  seriesField: 'category',
  legend: { size: true },
  colorField: 'category',
  xAxis: {
    type: 'time',
  },
}
