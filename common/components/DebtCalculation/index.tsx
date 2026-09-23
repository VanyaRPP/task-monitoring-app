import { useGetDebtCalculationQuery } from '@common/api/debtCalculationApi/debtCalculation.api'
import { useGetInflationIndexesQuery } from '@common/api/inflationIndexApi/inflationIndex.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import TableCard from '@common/components/UI/TableCard'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useDebtCalculationAccess } from '@modules/hooks/useDebtCalculationAccess'
import {
  buildDebtCalculationInput,
  IApartmentOverrides,
  IMonthOverride,
  indexesByPeriod,
} from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import {
  draftKey,
  isDraftNewer,
  readDraft,
} from '@utils/debt-calculation/draft-storage'
import { formatPeriod, IYearMonth } from '@utils/debt-calculation/months'
import { buildMonthPrefill } from '@utils/debt-calculation/prefill'
import { IDebtCalculationSnapshot } from '@utils/debt-calculation/serialize'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationResult,
  InflationMethod,
} from '@utils/debt-calculation/types'
import { Alert } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import DebtCalculationBody from './Body'
import DebtCalculationHeader from './Header'
import { IAutoSave, useAutoSave } from './useAutoSave'

// Neither payments nor monthly services can be filtered by a date range on the
// server, so we pull the domain's catalog whole and bucket it by month here.
const PREFILL_PAYMENTS_LIMIT = 5000
const PREFILL_SERVICES_LIMIT = 500

const toYearMonth = (value?: Dayjs | null): IYearMonth | undefined =>
  value ? { year: value.year(), month: value.month() + 1 } : undefined

const toDayjs = (value?: IYearMonth): Dayjs | undefined =>
  value
    ? dayjs()
        .year(value.year)
        .month(value.month - 1)
        .startOf('month')
    : undefined

export interface IDebtCalculationContext extends IAutoSave {
  allowedDomainIds: string[]
  domainId?: string
  setDomainId: (value?: string) => void
  companies: IExtendedRealestate[]
  companyId?: string
  setCompanyId: (value?: string) => void
  company?: IExtendedRealestate
  from?: Dayjs
  to?: Dayjs
  setFrom: (value?: Dayjs) => void
  setTo: (value?: Dayjs) => void
  annualRatePercent: number
  setAnnualRatePercent: (value: number) => void
  inflationMethod: InflationMethod
  setInflationMethod: (value: InflationMethod) => void
  /** The selected company's calculation. */
  result?: IDebtCalculationResult
  overrides: IApartmentOverrides
  /** Prefilled from the DB, per month, for the selected company. */
  prefillMonths: Record<string, IMonthOverride>
  setApartmentOverride: (patch: Partial<IApartmentOverrides>) => void
  setMonthOverride: (period: string, patch: IMonthOverride) => void
  /** Months of the period the CPI table has no entry for. */
  missingIndexPeriods: string[]
  isLoading: boolean
}

export const DebtCalculationContext =
  createContext<IDebtCalculationContext>(null)

export const useDebtCalculationContext = (): IDebtCalculationContext =>
  useContext(DebtCalculationContext)

/**
 * Housing-fee debt calculation, one company at a time.
 *
 * State lives in React rather than an antd Form: there is no submit here, and
 * an editable month × field matrix in a Form.List would cost more than any
 * validation it might buy.
 */
const DebtCalculationBlock: React.FC = () => {
  const { domainIds: allowedDomainIds, isLoading: isAccessLoading } =
    useDebtCalculationAccess()

  const [domainId, setDomainId] = useState<string | undefined>()
  const [companyId, setCompanyId] = useState<string | undefined>()
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
  const [overrides, setOverrides] = useState<IApartmentOverrides>({})

  const { data: { data: companies } = { data: [] }, isLoading: isCompanies } =
    useGetAllRealEstateQuery({ domainId, archived: false }, { skip: !domainId })

  const company = useMemo(
    () => (companies ?? []).find(({ _id }) => _id === companyId),
    [companies, companyId]
  )

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

  const { data: { data: payments } = { data: [] }, isLoading: isPayments } =
    useGetAllPaymentsQuery(
      {
        limit: PREFILL_PAYMENTS_LIMIT,
        domainIds: [domainId],
        companyIds: [companyId],
      },
      { skip: !domainId || !companyId }
    )

  const { data: { data: services } = { data: [] }, isLoading: isServices } =
    useGetAllServicesQuery(
      { domainId, limit: PREFILL_SERVICES_LIMIT },
      { skip: !domainId }
    )

  const prefillMonths = useMemo(
    () =>
      companyId ? buildMonthPrefill({ companyId, payments, services }) : {},
    [companyId, payments, services]
  )

  const { data: saved, isFetching: isSavedFetching } =
    useGetDebtCalculationQuery(
      { domainId, companyId },
      { skip: !domainId || !companyId }
    )

  // What comes from the DB or the draft is applied exactly once per company,
  // otherwise every refetch would clobber what the user is typing right now.
  const appliedKey = useRef<string>('')
  const [isApplied, setIsApplied] = useState(false)

  useEffect(() => {
    if (!domainId || !companyId || isSavedFetching) return

    const key = `${domainId}:${companyId}`
    if (appliedKey.current === key) return
    appliedKey.current = key

    const draft = readDraft(draftKey(domainId, companyId))
    const snapshot: IDebtCalculationSnapshot | undefined = isDraftNewer(
      draft,
      saved?.updatedAt
    )
      ? draft.snapshot
      : (saved as IDebtCalculationSnapshot | undefined)

    setOverrides(snapshot?.overrides?.[companyId] ?? {})
    setAnnualRatePercent(
      snapshot?.annualRatePercent ?? DEFAULT_ANNUAL_RATE_PERCENT
    )
    setInflationMethod(snapshot?.inflationMethod ?? 'balance')
    if (snapshot?.periodFrom) setFrom(toDayjs(snapshot.periodFrom))
    if (snapshot?.periodTo) setTo(toDayjs(snapshot.periodTo))
    setIsApplied(true)
  }, [domainId, companyId, saved, isSavedFetching])

  useEffect(() => {
    setIsApplied(false)
    setOverrides({})
  }, [companyId])

  const result = useMemo(
    () =>
      companyId
        ? calculateDebt(
            buildDebtCalculationInput({
              company,
              from: fromYearMonth,
              to: toYearMonthValue,
              indexByPeriod,
              overrides,
              prefillMonths,
              annualRatePercent,
              inflationMethod,
            })
          )
        : undefined,
    [
      companyId,
      company,
      fromYearMonth,
      toYearMonthValue,
      indexByPeriod,
      overrides,
      prefillMonths,
      annualRatePercent,
      inflationMethod,
    ]
  )

  const snapshot = useMemo<IDebtCalculationSnapshot>(
    () => ({
      domain: domainId,
      company: companyId,
      periodFrom: fromYearMonth,
      periodTo: toYearMonthValue,
      annualRatePercent,
      inflationMethod,
      overrides: companyId ? { [companyId]: overrides } : {},
    }),
    [
      domainId,
      companyId,
      fromYearMonth,
      toYearMonthValue,
      annualRatePercent,
      inflationMethod,
      overrides,
    ]
  )

  const autoSave = useAutoSave({
    domainId,
    companyId,
    snapshot,
    enabled: isApplied,
  })

  const setApartmentOverride = (patch: Partial<IApartmentOverrides>) =>
    setOverrides((prev) => ({ ...prev, ...patch }))

  const setMonthOverride = (period: string, patch: IMonthOverride) =>
    setOverrides((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [period]: {
          ...prev.months?.[period],
          ...patch,
          // The edit stamp sits next to the value; the page reads it to show
          // when this month was last touched by hand.
          updatedAt: new Date().toISOString(),
        },
      },
    }))

  const missingIndexPeriods = useMemo(
    () =>
      (result?.rows ?? [])
        .filter(
          ({ year, month }) => !indexByPeriod[formatPeriod({ year, month })]
        )
        .map(({ year, month }) => formatPeriod({ year, month })),
    [result, indexByPeriod]
  )

  const value: IDebtCalculationContext = {
    allowedDomainIds,
    domainId,
    setDomainId,
    companies: companies ?? [],
    companyId,
    setCompanyId,
    company,
    from,
    to,
    setFrom,
    setTo,
    annualRatePercent,
    setAnnualRatePercent,
    inflationMethod,
    setInflationMethod,
    result,
    overrides,
    prefillMonths,
    setApartmentOverride,
    setMonthOverride,
    missingIndexPeriods,
    isLoading:
      isAccessLoading || isCompanies || isIndexes || isPayments || isServices,
    ...autoSave,
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
        <DebtCalculationBody />
      </TableCard>
    </DebtCalculationContext.Provider>
  )
}

export default DebtCalculationBlock
