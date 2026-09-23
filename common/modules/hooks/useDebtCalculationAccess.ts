import { useGetDomainIdsByServiceTypeQuery } from '@common/api/domainApi/domain.api'
import { ServiceType } from '@utils/constants'

export interface IDebtCalculationAccess {
  /** `_id` доменів, у каталозі яких є послуга «Квартплата». */
  domainIds: string[]
  /** Хоча б один домен має послугу — є сенс показувати сторінку. */
  hasAccess: boolean
  isLoading: boolean
}

/**
 * Доступ до розрахунку заборгованості.
 *
 * Ендпоінт адмінський: не-адмін отримує 403, `data` лишається порожньою і
 * `hasAccess` буде `false` — тобто гейт закривається сам собою.
 */
export const useDebtCalculationAccess = (
  skip = false
): IDebtCalculationAccess => {
  const { data = [], isLoading } = useGetDomainIdsByServiceTypeQuery(
    ServiceType.HousingFee,
    { skip }
  )

  return { domainIds: data, hasAccess: data.length > 0, isLoading }
}
