import {
  useDeleteDebtCalculationMutation,
  useGetDebtCalculationsQuery,
  useSaveDebtCalculationMutation,
} from '@common/api/debtCalculationApi/debtCalculation.api'
import { ISavedDebtCalculation } from '@common/api/debtCalculationApi/debtCalculation.api.types'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import TableCard from '@common/components/UI/TableCard'
import { useDebtCalculationAccess } from '@modules/hooks/useDebtCalculationAccess'
import {
  buildDebtCalculationInput,
  IApartmentOverrides,
  IMonthOverride,
  indexesByPeriod,
} from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import { buildMonthPrefill } from '@utils/debt-calculation/prefill'
import { formatPeriod, IYearMonth } from '@utils/debt-calculation/months'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationResult,
  InflationMethod,
} from '@utils/debt-calculation/types'
import { Alert, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import DebtCalculationHeader from './Header'
import DebtCalculationTable from './Table'

const toYearMonth = (value?: Dayjs | null): IYearMonth | undefined =>
  value ? { year: value.year(), month: value.month() + 1 } : undefined

// Ні платежі, ні місячні послуги не фільтруються за діапазоном дат на сервері,
// тож тягнемо каталог домену цілком і розкладаємо по місяцях на клієнті.
const PREFILL_PAYMENTS_LIMIT = 5000
const PREFILL_SERVICES_LIMIT = 500

const toDayjs = (value?: IYearMonth): Dayjs | undefined =>
  value
    ? dayjs()
        .year(value.year)
        .month(value.month - 1)
        .startOf('month')
    : undefined

export interface IDebtCalculationContext {
  domainId?: string
  setDomainId: (value?: string) => void
  allowedDomainIds: string[]
  from?: Dayjs
  to?: Dayjs
  setFrom: (value?: Dayjs) => void
  setTo: (value?: Dayjs) => void
  annualRatePercent: number
  setAnnualRatePercent: (value: number) => void
  inflationMethod: InflationMethod
  setInflationMethod: (value: InflationMethod) => void
  companies: IExtendedRealestate[]
  /** Результат розрахунку по кожній квартирі, ключ — `company._id`. */
  results: Record<string, IDebtCalculationResult>
  overrides: Record<string, IApartmentOverrides>
  /** Підтягнуте з БД по місяцях: `{ companyId: { 'YYYY-MM': {...} } }`. */
  prefillByCompany: Record<string, Record<string, IMonthOverride>>
  setApartmentOverride: (
    companyId: string,
    patch: Partial<IApartmentOverrides>
  ) => void
  setMonthOverride: (
    companyId: string,
    period: string,
    patch: IMonthOverride
  ) => void
  /** Місяці періоду, для яких у довіднику немає ІСЦ. */
  missingIndexPeriods: string[]
  isLoading: boolean
  savedCalculations: ISavedDebtCalculation[]
  currentId?: string
  name: string
  setName: (value: string) => void
  /** Є незбережені зміни — від цього залежить і попередження при виході. */
  isDirty: boolean
  isSaving: boolean
  save: () => Promise<void>
  load: (id: string) => void
  remove: () => Promise<void>
  reset: () => void
}

export const DebtCalculationContext =
  createContext<IDebtCalculationContext>(null)

export const useDebtCalculationContext = (): IDebtCalculationContext =>
  useContext(DebtCalculationContext)

/**
 * Розрахунок заборгованості за квартплатою.
 *
 * Стан тримаємо у React, а не в antd Form: тут немає сабміту, а редагована
 * матриця «квартира × місяць × поле» у Form.List коштувала б дорожче за будь-яку
 * вигоду від валідації.
 */
const DebtCalculationBlock: React.FC = () => {
  const { domainIds: allowedDomainIds, isLoading: isAccessLoading } =
    useDebtCalculationAccess()

  const [domainId, setDomainId] = useState<string | undefined>()
  const [from, setFrom] = useState<Dayjs | undefined>(() =>
    dayjs().subtract(1, 'year').startOf('month')
  )
  const [to, setTo] = useState<Dayjs | undefined>(() =>
    dayjs().subtract(1, 'month').startOf('month')
  )
  const [annualRatePercent, setAnnualRatePercent] = useState(
    DEFAULT_ANNUAL_RATE_PERCENT
  )
  const [inflationMethod, setInflationMethod] =
    useState<InflationMethod>('balance')
  const [overrides, setOverrides] = useState<
    Record<string, IApartmentOverrides>
  >({})
  const [currentId, setCurrentId] = useState<string | undefined>()
  const [name, setName] = useState('')
  // Знімок на момент останнього збереження/завантаження — база для isDirty.
  const [savedJson, setSavedJson] = useState('')

  const { data: savedCalculations = [] } = useGetDebtCalculationsQuery(
    { domainId },
    { skip: !domainId }
  )
  const [saveCalculation, { isLoading: isSaving }] =
    useSaveDebtCalculationMutation()
  const [deleteCalculation] = useDeleteDebtCalculationMutation()

  const { data: { data: companies } = { data: [] }, isLoading: isCompanies } =
    useGetAllRealEstateQuery({ domainId, archived: false }, { skip: !domainId })

  const fromYearMonth = useMemo(() => toYearMonth(from), [from])
  const toYearMonthValue = useMemo(() => toYearMonth(to), [to])

  const { data: indexes = [], isLoading: isIndexes } =
    useGetInflationIndexesQuery(
      {
        from: fromYearMonth && formatPeriod(fromYearMonth),
        to: toYearMonthValue && formatPeriod(toYearMonthValue),
      },
      { skip: !from || !to }
    )

  const indexByPeriod = useMemo(() => indexesByPeriod(indexes), [indexes])

  const companyIds = useMemo(
    () => (companies ?? []).map(({ _id }) => _id),
    [companies]
  )

  const { data: { data: payments } = { data: [] }, isLoading: isPayments } =
    useGetAllPaymentsQuery(
      { limit: PREFILL_PAYMENTS_LIMIT, domainIds: [domainId], companyIds },
      { skip: !domainId || companyIds.length === 0 }
    )

  const { data: { data: services } = { data: [] }, isLoading: isServices } =
    useGetAllServicesQuery(
      { domainId, limit: PREFILL_SERVICES_LIMIT },
      { skip: !domainId }
    )

  const prefillByCompany = useMemo(
    () =>
      (companies ?? []).reduce<Record<string, Record<string, IMonthOverride>>>(
        (acc, { _id }) => {
          acc[_id] = buildMonthPrefill({ companyId: _id, payments, services })
          return acc
        },
        {}
      ),
    [companies, payments, services]
  )

  const setApartmentOverride = (
    companyId: string,
    patch: Partial<IApartmentOverrides>
  ) =>
    setOverrides((prev) => ({
      ...prev,
      [companyId]: { ...prev[companyId], ...patch },
    }))

  const setMonthOverride = (
    companyId: string,
    period: string,
    patch: IMonthOverride
  ) =>
    setOverrides((prev) => {
      const apartment = prev[companyId] ?? {}
      return {
        ...prev,
        [companyId]: {
          ...apartment,
          months: {
            ...apartment.months,
            [period]: { ...apartment.months?.[period], ...patch },
          },
        },
      }
    })

  const results = useMemo(() => {
    return (companies ?? []).reduce<Record<string, IDebtCalculationResult>>(
      (acc, company) => {
        acc[company._id] = calculateDebt(
          buildDebtCalculationInput({
            company,
            from: fromYearMonth,
            to: toYearMonthValue,
            indexByPeriod,
            overrides: overrides[company._id],
            prefillMonths: prefillByCompany[company._id],
            annualRatePercent,
            inflationMethod,
          })
        )
        return acc
      },
      {}
    )
  }, [
    companies,
    fromYearMonth,
    toYearMonthValue,
    indexByPeriod,
    overrides,
    prefillByCompany,
    annualRatePercent,
    inflationMethod,
  ])

  const missingIndexPeriods = useMemo(() => {
    const first = Object.values(results)[0]
    return (first?.rows ?? [])
      .filter(
        ({ year, month }) => !indexByPeriod[formatPeriod({ year, month })]
      )
      .map(({ year, month }) => formatPeriod({ year, month }))
  }, [results, indexByPeriod])

  const snapshot = useMemo(
    () => ({
      domain: domainId,
      periodFrom: fromYearMonth,
      periodTo: toYearMonthValue,
      annualRatePercent,
      inflationMethod,
      overrides,
    }),
    [
      domainId,
      fromYearMonth,
      toYearMonthValue,
      annualRatePercent,
      inflationMethod,
      overrides,
    ]
  )

  const snapshotJson = JSON.stringify(snapshot)
  const isDirty = !!domainId && snapshotJson !== savedJson

  // Введене живе в пам'яті доти, доки його не збережено. Без цього попередження
  // випадковий Cmd+W після години забивання даних коштував би годину.
  useEffect(() => {
    if (!isDirty) return

    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)

    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const save = async () => {
    const title = name.trim()
    if (!title) {
      message.warning('Вкажіть назву розрахунку')
      return
    }

    try {
      const saved = await saveCalculation({
        ...snapshot,
        _id: currentId,
        name: title,
      }).unwrap()

      setCurrentId(saved._id)
      setSavedJson(snapshotJson)
      message.success('Розрахунок збережено')
    } catch {
      message.error('Не вдалося зберегти розрахунок')
    }
  }

  const load = (id: string) => {
    const found = savedCalculations.find((item) => item._id === id)
    if (!found) return

    setCurrentId(found._id)
    setName(found.name)
    setDomainId(String(found.domain))
    setFrom(toDayjs(found.periodFrom))
    setTo(toDayjs(found.periodTo))
    setAnnualRatePercent(found.annualRatePercent ?? DEFAULT_ANNUAL_RATE_PERCENT)
    setInflationMethod(found.inflationMethod ?? 'balance')
    setOverrides(found.overrides ?? {})
    setSavedJson(
      JSON.stringify({
        domain: String(found.domain),
        periodFrom: found.periodFrom,
        periodTo: found.periodTo,
        annualRatePercent: found.annualRatePercent,
        inflationMethod: found.inflationMethod,
        overrides: found.overrides ?? {},
      })
    )
  }

  const remove = async () => {
    if (!currentId) return

    try {
      await deleteCalculation(currentId).unwrap()
      reset()
      message.success('Розрахунок видалено')
    } catch {
      message.error('Не вдалося видалити розрахунок')
    }
  }

  const reset = () => {
    setCurrentId(undefined)
    setName('')
    setOverrides({})
    setSavedJson('')
  }

  const value: IDebtCalculationContext = {
    domainId,
    setDomainId,
    allowedDomainIds,
    from,
    to,
    setFrom,
    setTo,
    annualRatePercent,
    setAnnualRatePercent,
    inflationMethod,
    setInflationMethod,
    companies: companies ?? [],
    results,
    overrides,
    prefillByCompany,
    setApartmentOverride,
    setMonthOverride,
    missingIndexPeriods,
    savedCalculations,
    currentId,
    name,
    setName,
    isDirty,
    isSaving,
    save,
    load,
    remove,
    reset,
    isLoading:
      isAccessLoading || isCompanies || isIndexes || isPayments || isServices,
  }

  if (!isAccessLoading && allowedDomainIds.length === 0) {
    return (
      <Alert
        showIcon
        type="info"
        message="Розрахунок заборгованості недоступний"
        description="Жоден домен не має послуги «Квартплата». Додайте домену шаблон «Квартплата» — і сторінка запрацює."
      />
    )
  }

  return (
    <DebtCalculationContext.Provider value={value}>
      <TableCard title={<DebtCalculationHeader />}>
        <DebtCalculationTable />
      </TableCard>
    </DebtCalculationContext.Provider>
  )
}

export default DebtCalculationBlock
