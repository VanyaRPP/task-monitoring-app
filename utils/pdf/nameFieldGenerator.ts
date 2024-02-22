import Service from '@common/modules/models/Service'
import { ServiceType } from '@utils/constants'
import { getFormattedDate } from '@utils/helpers'
import moment from 'moment'

export default async function nameField(invoiceType, paymentData) {
  const paymentDate =
    paymentData?.monthService?.date ||
    paymentData?.invoiceCreationDate ||
    paymentData?.service?.date
  const dateMonth = getFormattedDate(paymentDate)

  const company = paymentData?.company
  switch (invoiceType) {
    case ServiceType.GarbageCollector:
      return await generateGarbageCollectorField(dateMonth)
    case ServiceType.Electricity:
      return await generateElectricityField(dateMonth)
    case ServiceType.Maintenance:
      return await generateMaintenanceField(dateMonth, paymentData?.company)
    case ServiceType.WaterPart:
      return await generateWaterPartField(dateMonth)
    case ServiceType.Inflicion:
      return await GenerateInflicionField(paymentData)
    case ServiceType.Discount:
      return await generateDiscountField(dateMonth)
    case ServiceType.Placing:
      return await generatePlacingField(dateMonth, company)
    case ServiceType.Water:
      return await generateWaterField(dateMonth)
    case ServiceType.ElectricUtility:
      return await generatePublicElectricUtilityField(dateMonth)
    case ServiceType.Cleaning:
      return await generateCleaningField(dateMonth)
  }
}

async function generateGarbageCollectorField(dateMonth: string) {
  return `<span>
    Вивіз ТПВ<br><small class="muted">${dateMonth}</small>
  </span>`
}

async function generatePlacingField(dateMonth: string, company: any) {
  return `<span>
      Розміщення<br><small class="muted">${dateMonth}</small>
      ${
        !!company?.inflicion
          ? '<br><small class="muted">без врахування індексу інфляції</small>'
          : ''
      }
    </span>`
}

async function generateMaintenanceField(dateMonth, company) {
  return `<span>
      Утримання<br><small class="muted">${dateMonth}</small>
      ${
        company?.servicePricePerMeter
          ? '<small class="muted">індивідуальне</small>'
          : ''
      }
    </span>`
}

async function generateElectricityField(dateMonth: string) {
  return `<span>
      Електропостачання<br><small class="muted">${dateMonth}</small>
    </span>`
}

async function generateWaterField(dateMonth: string) {
  return `<span>
      Водопостачання<br><small class="muted">${dateMonth}</small>
    </span>`
}

async function generatePublicElectricUtilityField(dateMonth: string) {
  return `<span>
      МЗК електрика<br><small class="muted">${dateMonth}</small>
    </span>`
}

async function generateWaterPartField(dateMonth: string) {
  return `<span>
      Нарахування водопостачання<br><small class="muted">${dateMonth}</small>
    </span>`
}

async function generateDiscountField(dateMonth: string) {
  return `<span>
      Знижка<br><small class="muted">${dateMonth}</small>
    </span>`
}

async function generateCleaningField(dateMonth: string) {
  return `<span>
      Прибирання<br><small class="muted">${dateMonth}</small>
    </span>`
}

async function GenerateInflicionField(paymentData) {
  const domainId = paymentData?.domain?._id
  const streetId = paymentData?.street?._id
  const date = paymentData?.monthService?.date || paymentData?.service?.date

  const services = await getPreviousMonthService({
    domainId: domainId,
    streetId: streetId,
    date: date,
  })

  const inflicionPriceObject = paymentData.invoice.find(
    (item) => item.type === 'inflicionPrice'
  )
  const inflicionPrice = inflicionPriceObject.price

  const previousMonth = services?.[0]

  const inflicionIndexTitle = previousMonth
    ? `
    <small>
      ${
        previousMonth.date
          ? `<br /><b>${moment(previousMonth.date).format('MMMM')}</b>`
          : ''
      }
      ${
        previousMonth.inflicionPrice !== undefined
          ? `${previousMonth.inflicionPrice.toFixed(2)}%`
          : 'невідомий'
      }
    </small>
  `
    : `
    <div>
      <br /><small class="muted">за попередній місяць невідомий</small>
    </div>
  `
  const inflicionChanges = `<span>
      ${
        paymentData?.company?.inflicion && previousMonth
          ? `<br />
          ${
            +inflicionPrice <= 0 || +previousMonth?.inflicionPrice <= 100
              ? `<small class="muted">Спостерігається дефляція.</small>
             <br />
             <small class="muted">Значення незмінне</small>`
              : `<br />
             <small class="muted">донарахування</small>`
          }
        `
          : ''
      }
    </span>`

  return `
  <div>
    Індекс інфляції
    ${inflicionIndexTitle}
    ${inflicionChanges}
  </div>
`
}

interface Options {
  domain: any
  street: any
  $expr?: any
}

async function getPreviousMonthService({ domainId, streetId, date }) {
  try {
    const lastMonth = moment(date).subtract(1, 'month')
    const month = lastMonth.month() + 1
    const defaultOption = {
      domainId,
      streetId,
      month: month,
      year: lastMonth.year(),
    }

    const options: Options = {
      domain: null,
      street: null,
    }
    const limit = 0
    if (domainId && streetId) {
      options.domain = domainId
      options.street = streetId

      const expr = filterPeriodOptions(defaultOption)

      if (expr.length > 0) {
        options.$expr = { $and: expr }
      }
      const services = await Service.find(options)
        .sort({ date: -1 })
        .limit(+limit)

      return services
    }
  } catch (error) {
    return null
  }
}

function filterPeriodOptions(args) {
  const { year, month } = args
  const filterByDateOptions = []
  if (year) {
    filterByDateOptions.push({ $eq: [{ $year: '$date' }, year] })
  }
  if (month) {
    filterByDateOptions.push({ $eq: [{ $month: '$date' }, month] })
  }
  return filterByDateOptions
}
