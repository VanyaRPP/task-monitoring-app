import { IYearMonth } from './months'

/**
 * Спосіб нарахування інфляційних втрат.
 *
 * `balance` — як в Акті ОСББ: сукупний коефіцієнт за весь період множиться на
 *   ВЕСЬ поточний залишок боргу, включно з нарахуваннями останніх місяців.
 *
 * `monthly` — як вимагає ст. 625 ЦК і практика ВС: кожне нарахування
 *   індексується від місяця, НАСТУПНОГО за місяцем його виникнення, а оплати
 *   гасять найстаріший борг (FIFO). Дає помітно меншу суму.
 */
export type InflationMethod = 'balance' | 'monthly'

/** Ставка річних за ст. 625 ЦК, якщо договором не встановлено іншу. */
export const DEFAULT_ANNUAL_RATE_PERCENT = 3

/** Один місяць періоду — те, що вводиться або підтягується з БД. */
export interface IDebtMonthInput extends IYearMonth {
  /** Загальна площа, м². */
  area?: number
  /** Тариф (членський внесок), грн за 1 м². */
  tariff?: number
  /** Нараховано, грн. Якщо не задано — рахується як `area × tariff`. */
  charged?: number
  /** Сплачено, грн. */
  paid?: number
  /** Місячний індекс інфляції (ІСЦ), %: `100.8` означає +0.8%. */
  inflationIndex?: number
}

export interface IDebtCalculationInput {
  months: IDebtMonthInput[]
  /** Борг на початок періоду, грн. */
  openingDebt?: number
  /** Річна ставка, %. За замовчуванням {@link DEFAULT_ANNUAL_RATE_PERCENT}. */
  annualRatePercent?: number
  /** За замовчуванням `balance` — як в Акті. */
  inflationMethod?: InflationMethod
  /**
   * Чи нараховувати річні на внесок у тому ж місяці, в якому його нараховано.
   *
   * `true` (за замовчуванням) повторює Акт. `false` — наближення до статуту зі
   * строком оплати в наступному місяці: внесок починає "капати" лише з
   * наступного місяця. Точне число дня оплати з'явиться тут, коли ОСББ його
   * підтвердить.
   */
  interestOnCurrentCharge?: boolean
  /** Юридичні послуги, грн — окремий рядок підсумку. */
  legalFees?: number
  /** Держмито, грн — окремий рядок підсумку. */
  courtFee?: number
}

/** Порахований місяць — рядок помісячної деталізації. */
export interface IDebtMonthRow extends IYearMonth {
  area: number
  tariff: number
  /** Нараховано, грн (кол. D Акта). */
  charged: number
  /** Сплачено, грн (кол. C). */
  paid: number
  /** Сума боргу на кінець місяця, грн (кол. I). */
  debt: number
  /** Календарних днів у місяці (кол. J). */
  days: number
  /** Місячний індекс інфляції, % (кол. K). */
  inflationIndex: number
  /** Сукупний коефіцієнт індексації з початку періоду (кол. L). */
  coefficient: number
  /** Інфляційні втрати станом на цей місяць, грн (кол. M). */
  inflationLoss: number
  /** 3% річних за цей місяць, грн (кол. H). */
  interest: number
}

export interface IDebtCalculationResult {
  rows: IDebtMonthRow[]
  totals: {
    charged: number
    paid: number
    /** Сума річних за всі місяці — саме вона йде в підсумок. */
    interest: number
    days: number
  }
  /** Тіло боргу: `борг на початок + Σ нараховано − Σ сплачено`. */
  body: number
  /** 3% річних — дублює `totals.interest` для читабельності підсумку. */
  interest: number
  /**
   * Інфляційні втрати за обраним методом.
   *
   * Це значення ОСТАННЬОГО місяця, а не сума по місяцях — накопичувальний
   * коефіцієнт уже враховує весь період.
   */
  inflation: number
  /** Сукупний коефіцієнт індексації за період. */
  coefficient: number
  legalFees: number
  courtFee: number
  /** `body + interest + inflation + legalFees + courtFee`. */
  total: number
}
