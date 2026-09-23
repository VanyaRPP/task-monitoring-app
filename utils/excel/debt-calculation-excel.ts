import { formatPeriod, IYearMonth } from '@utils/debt-calculation/months'
import {
  IDebtCalculationResult,
  InflationMethod,
} from '@utils/debt-calculation/types'
import { cascaderMonths } from '@utils/constants'

export interface IDebtExcelApartment {
  name: string
  description?: string
  result: IDebtCalculationResult
}

export interface IDebtExcelInput {
  apartments: IDebtExcelApartment[]
  from?: IYearMonth
  to?: IYearMonth
  annualRatePercent: number
  inflationMethod: InflationMethod
  domainName?: string
  generatedAt?: Date
}

export type ExcelRow = Record<string, string | number>

export interface IDebtExcelSheets {
  summary: ExcelRow[]
  months: ExcelRow[]
  params: ExcelRow[]
}

export const SUMMARY_SHEET = 'Підсумок'
export const MONTHS_SHEET = 'Помісячно'
export const PARAMS_SHEET = 'Параметри'

const TOTAL_LABEL = 'РАЗОМ'

/** Числа йдуть у файл числами, не рядками — інакше в Excel їх не підсумуєш. */
const money = (value?: number): number =>
  Number.isFinite(value) ? +(value as number).toFixed(2) : 0

const monthLabel = ({ year, month }: IYearMonth): string =>
  `${cascaderMonths[month - 1]?.label ?? month} ${year}`

const periodLabel = (value?: IYearMonth): string =>
  value ? formatPeriod(value) : '—'

const METHOD_LABEL: Record<InflationMethod, string> = {
  balance: 'За залишком боргу (як у паперовому Акті)',
  monthly: 'Помісячний (ст. 625 ЦК)',
}

/**
 * Готує дані трьох аркушів для експорту розрахунку заборгованості.
 *
 * Чиста функція: жодного `xlsx` тут немає, щоб її можна було ганяти тестами в
 * Node, а важку бібліотеку вантажити в браузері лише в мить натискання кнопки.
 */
export const buildDebtCalculationSheets = ({
  apartments,
  from,
  to,
  annualRatePercent,
  inflationMethod,
  domainName,
  generatedAt = new Date(),
}: IDebtExcelInput): IDebtExcelSheets => {
  const interestColumn = `${annualRatePercent}% річних`

  const summary: ExcelRow[] = apartments.map(
    ({ name, description, result }) => ({
      Квартира: name,
      Опис: description ?? '',
      'Борг на початок': money(
        result.body - result.totals.charged + result.totals.paid
      ),
      Нараховано: money(result.totals.charged),
      Сплачено: money(result.totals.paid),
      'Тіло боргу': money(result.body),
      [interestColumn]: money(result.interest),
      Інфляційні: money(result.inflation),
      'Юр. послуги': money(result.legalFees),
      Держмито: money(result.courtFee),
      Разом: money(result.total),
    })
  )

  if (apartments.length > 0) {
    const sum = (pick: (a: IDebtExcelApartment) => number): number =>
      money(apartments.reduce((acc, item) => acc + pick(item), 0))

    summary.push({
      Квартира: TOTAL_LABEL,
      Опис: '',
      'Борг на початок': sum(
        ({ result }) => result.body - result.totals.charged + result.totals.paid
      ),
      Нараховано: sum(({ result }) => result.totals.charged),
      Сплачено: sum(({ result }) => result.totals.paid),
      'Тіло боргу': sum(({ result }) => result.body),
      [interestColumn]: sum(({ result }) => result.interest),
      Інфляційні: sum(({ result }) => result.inflation),
      'Юр. послуги': sum(({ result }) => result.legalFees),
      Держмито: sum(({ result }) => result.courtFee),
      Разом: sum(({ result }) => result.total),
    })
  }

  const months: ExcelRow[] = apartments.flatMap(({ name, result }) =>
    result.rows.map((row) => ({
      Квартира: name,
      Місяць: monthLabel(row),
      Сплачено: money(row.paid),
      Нараховано: money(row.charged),
      'Площа, м²': money(row.area),
      'Тариф, грн/м²': money(row.tariff),
      Річних: money(row.interest),
      'Сума боргу': money(row.debt),
      Днів: row.days,
      'Індекс інфляції, %': money(row.inflationIndex),
      Коефіцієнт: +row.coefficient.toFixed(6),
      Інфляційні: money(row.inflationLoss),
    }))
  )

  const params: ExcelRow[] = [
    { Параметр: 'Домен', Значення: domainName ?? '—' },
    { Параметр: 'Період з', Значення: periodLabel(from) },
    { Параметр: 'Період по', Значення: periodLabel(to) },
    { Параметр: 'Ставка річних, %', Значення: annualRatePercent },
    { Параметр: 'Метод інфляційних', Значення: METHOD_LABEL[inflationMethod] },
    { Параметр: 'Квартир у розрахунку', Значення: apartments.length },
    {
      Параметр: 'Сформовано',
      Значення: generatedAt.toISOString().slice(0, 16).replace('T', ' '),
    },
    {
      Параметр: 'Увага',
      Значення:
        'Інфляційні втрати — це значення останнього місяця, а не сума по колонці «Інфляційні»: коефіцієнт індексації накопичувальний.',
    },
  ]

  return { summary, months, params }
}

/** Ім'я файлу: домен і період, без пробілів і слешів. */
export const debtCalculationFileName = (
  domainName?: string,
  from?: IYearMonth,
  to?: IYearMonth
): string =>
  [
    'Розрахунок-заборгованості',
    (domainName ?? '').trim().replace(/[\s/\\]+/g, '-'),
    from && to ? `${formatPeriod(from)}_${formatPeriod(to)}` : '',
  ]
    .filter(Boolean)
    .join('_')
