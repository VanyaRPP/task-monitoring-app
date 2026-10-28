import {
  buildDebtCalculationDocument,
  debtCalculationFileName,
  IDebtExcelDocument,
} from '@utils/excel/debt-calculation-excel'
import { periodsWithin } from '@utils/debt-calculation/exclusions'
import { daysInMonth, IYearMonth } from '@utils/debt-calculation/months'
import { Dayjs } from 'dayjs'
import { useDebtCalculationContext } from './'

export interface IDebtDocument {
  document: IDebtExcelDocument
  /** Without an extension: `.xlsx` for Excel, the print dialog's PDF name. */
  fileName: string
}

const pad = (value: number): string => String(value).padStart(2, '0')

const toYearMonth = (value?: Dayjs): IYearMonth | undefined =>
  value ? { year: value.year(), month: value.month() + 1 } : undefined

/**
 * The calculation on screen as one document, for every way out of the page:
 * the Excel file and the printout are built from this very object, so they
 * cannot drift apart. `null` while there is nothing to show.
 */
export const useDebtDocument = (
  domainName?: string
): (() => IDebtDocument | null) => {
  const {
    company,
    result,
    overrides = {},
    from,
    to,
    annualRatePercent,
    inflationMethod,
    excludedPeriods = [],
  } = useDebtCalculationContext()

  return () => {
    if (!result?.rows?.length) return null

    const periodFrom = toYearMonth(from)
    const periodTo = toYearMonth(to)
    const companyName = company?.companyName ?? 'Компанія'

    return {
      document: buildDebtCalculationDocument({
        companyName,
        description: company?.description,
        domainName,
        result,
        from: periodFrom,
        to: periodTo,
        annualRatePercent,
        inflationMethod,
        area: overrides.area ?? company?.totalArea,
        tariff: overrides.tariff ?? company?.pricePerMeter,
        openingDebt: overrides.openingDebt,
        startDay: overrides.startDay,
        // What the calculation applied: the periods cut to its span.
        excludedPeriods:
          periodFrom && periodTo
            ? periodsWithin(
                excludedPeriods,
                `${periodFrom.year}-${pad(periodFrom.month)}-01`,
                `${periodTo.year}-${pad(periodTo.month)}-${daysInMonth(
                  periodTo.year,
                  periodTo.month
                )}`
              )
            : [],
      }),
      fileName: debtCalculationFileName(companyName, periodFrom, periodTo),
    }
  }
}
