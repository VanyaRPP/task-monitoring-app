import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import { resolveServiceType } from '@utils/domain/resolve-service-type'

export interface IPlacingTariffContext {
  company?: Partial<IRealestate>
  /**
   * Місячна послуга, з якої беремо тариф. Інфляційні розрахунки свідомо
   * передають сюди послугу ПОПЕРЕДНЬОГО місяця — база індексації рахується
   * від неї.
   */
  service?: Partial<IService>
}

type ServiceCustomItem = NonNullable<IService['customServices']>[number]

/**
 * Рядок «Розміщення» у знімку каталогу, який несе місячна послуга.
 *
 * Шукаємо через спільний resolveServiceType, а не за одним fieldName: сид має
 * закріплений _id, а послуга, створена через форму, отримує транслітерований
 * fieldName ('Розміщення' -> 'rozmishchennia'). За _id ловимо обидва випадки.
 *
 * Per-domain копію з власним _id тут НЕ шукаємо: такі послуги мають власну
 * колонку-формулу і не повинні підміняти нативний тариф (див. коментар до
 * resolveCommunalType у PaymentsBulk/column.config.tsx).
 */
export const findPlacingServiceItem = (
  service?: Partial<IService>
): ServiceCustomItem | undefined => {
  if (!Array.isArray(service?.customServices)) return undefined

  return service.customServices.find(
    (item) =>
      resolveServiceType({
        _id: item?._id,
        fieldName: item?.fieldName,
      }) === ServiceType.Placing
  )
}

/**
 * Єдине джерело правди для тарифу Розміщення (грн/м²).
 *
 * Пріоритет:
 *   1. company.pricePerMeter — індивідуальна ціна за договором. У моделі поле
 *      `required: true, default: 0`, тому 0 тут означає «не задано», а не
 *      «безкоштовно» — звідси `||`, а не `??`.
 *   2. ціна рядка «Розміщення» з місячної послуги, включно з нулем: якщо
 *      послуга є в каталозі домену, її тариф авторитетний.
 *   3. лише для доменів БЕЗ послуги «Розміщення» в каталозі — історичний
 *      фолбек на service.rentPrice (це тариф УТРИМАННЯ). Тримаємо його рівно
 *      заради таких легасі-доменів; для всіх інших він мовчки дублював
 *      Утримання в Розміщення.
 */
export const resolvePlacingTariff = ({
  company,
  service,
}: IPlacingTariffContext): number => {
  if (company?.pricePerMeter) return +company.pricePerMeter || 0

  const placingItem = findPlacingServiceItem(service)
  if (placingItem) return +placingItem.price || 0

  return +service?.rentPrice || 0
}
