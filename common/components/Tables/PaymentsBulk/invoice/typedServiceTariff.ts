interface PricedCustomService {
  _id?: unknown
  fieldName?: string
  price?: unknown
}

interface TariffSources {
  company?: { customServices?: unknown } | null
  service?: { customServices?: unknown } | null
}

interface TariffTarget {
  serviceId: string
  fieldName?: string
}

const findPrice = (list: unknown, target: TariffTarget): number | undefined => {
  if (!Array.isArray(list)) return undefined
  const items = list as PricedCustomService[]

  // Спершу за _id по ВСЬОМУ списку: інакше інший лічильник із тим самим
  // fieldName (назви різняться лише дужками) перехопив би збіг.
  const byId = target.serviceId
    ? items.find((item) => String(item?._id ?? '') === target.serviceId)
    : undefined

  // fieldName відповідає лише за легасі-записи без власного _id.
  const match =
    byId ??
    (target.fieldName
      ? items.find((item) => !item?._id && item?.fieldName === target.fieldName)
      : undefined)

  const price = Number(match?.price)
  return Number.isFinite(price) ? price : undefined
}

/**
 * Тариф типізованої (лічильникової) кастомної послуги для конкретної компанії.
 *
 * Пріоритет такий самий, як у решти системи: індивідуальна ціна компанії
 * перебиває місячну, місячна — тариф адреси за замовчуванням. Нуль/порожньо
 * в компанії означає «індивідуального тарифу нема» і падає на місячний (як у
 * Розміщенні) — інакше компанії, яким послугу автоматично роздав бекенд із
 * `price: 0`, рахувалися б по нулю.
 *
 * Матчинг у першу чергу за стабільним `_id` — `fieldName` збігається у послуг,
 * назви яких різняться лише дужками.
 */
export function resolveTypedServiceTariff(
  sources: TariffSources,
  target: TariffTarget
): number {
  const fromCompany = findPrice(sources.company?.customServices, target)
  if (fromCompany) return fromCompany

  const fromService = findPrice(sources.service?.customServices, target)
  if (fromService) return fromService

  return 0
}
