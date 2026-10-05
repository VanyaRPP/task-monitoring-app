import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  useImportStatementMutation,
  usePlanStatementImportMutation,
} from '@common/api/paymentApi/payment.api'
import { Operations, ServiceType } from '@utils/constants'
import {
  planStatementImport,
  OPENING_RESOLUTION_KEY,
} from '@utils/debt-calculation/statement-plan'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import CreatePayments, { overwriteAll, tableStatement } from './CreatePayments'

jest.mock('@common/api/paymentApi/payment.api', () => ({
  usePlanStatementImportMutation: jest.fn(),
  useImportStatementMutation: jest.fn(),
}))

const DOMAIN = '507f1f77bcf86cd799439011'
const COMPANY = '507f1f77bcf86cd799439012'

const month = (m: number, charged: number, paid: number, correction = 0) => ({
  year: 2019,
  month: m,
  charged,
  correction,
  paid,
})

// What the engine shows for 10-12/2019: the table after the photo import.
const rows = [
  month(10, 424.46, 400),
  month(11, 424.46, 0, -6.86),
  month(12, 424.46, 0),
]

const at = (m: number) => new Date(Date.UTC(2019, m - 1, 1, 12))

// The system: October matches, November was entered by hand differently,
// December also carries a water invoice.
const payments = [
  {
    _id: 'oct-d',
    type: Operations.Debit,
    invoiceCreationDate: at(10),
    invoice: [{ type: ServiceType.HousingFee, price: 424.46, sum: 424.46 }],
  },
  {
    _id: 'oct-c',
    type: Operations.Credit,
    paidAt: at(10),
    invoiceCreationDate: at(10),
    generalSum: 400,
  },
  {
    _id: 'nov-d',
    type: Operations.Debit,
    invoiceCreationDate: at(11),
    invoice: [{ type: ServiceType.HousingFee, price: 500, sum: 500 }],
  },
  {
    _id: 'dec-d',
    type: Operations.Debit,
    invoiceCreationDate: at(12),
    invoice: [
      { type: ServiceType.HousingFee, price: 400, sum: 400 },
      { type: ServiceType.Water, price: 30, sum: 30 },
    ],
  },
]

const statement = tableStatement(rows, 16616.69)
const plan = planStatementImport(statement, payments)

const planFn = jest.fn()
const importFn = jest.fn()

const context = (patch: Partial<IDebtCalculationContext> = {}) =>
  ({
    domainId: DOMAIN,
    companyId: COMPANY,
    company: { companyName: 'Квартира №72' },
    result: { rows },
    openingDebt: 16616.69,
    refetchPayments: jest.fn(),
    clearTypedFigures: jest.fn(),
    ...patch,
  }) as unknown as IDebtCalculationContext

const setup = (patch?: Partial<IDebtCalculationContext>) => {
  const value = context(patch)
  render(
    <DebtCalculationContext.Provider value={value}>
      <CreatePayments />
    </DebtCalculationContext.Provider>
  )
  return value
}

beforeEach(() => {
  jest.clearAllMocks()
  planFn.mockResolvedValue({ data: plan })
  importFn.mockResolvedValue({
    data: {
      plan,
      result: {
        batchId: 'b1',
        createdIds: ['n1', 'n2', 'n3'],
        deletedIds: ['nov-d'],
        created: { debits: 1, credits: 0, opening: true },
      },
    },
  })
  ;(usePlanStatementImportMutation as jest.Mock).mockReturnValue([
    planFn,
    { isLoading: false, error: undefined },
  ])
  ;(useImportStatementMutation as jest.Mock).mockReturnValue([
    importFn,
    { isLoading: false, error: undefined },
  ])
})

describe('tableStatement', () => {
  it('місяці таблиці й вхідний борг на початок періоду', () => {
    expect(statement.openingBalance).toEqual({
      year: 2019,
      month: 10,
      amount: 16616.69,
    })
    expect(statement.months[1]).toEqual(month(11, 424.46, 0, -6.86))
  })

  it('без боргу на початок — без вхідного сальдо', () => {
    expect(tableStatement(rows, 0).openingBalance).toBeNull()
  })
})

describe('overwriteAll', () => {
  it('перезаписує все, що відрізняється, крім місяців з іншими послугами', () => {
    expect(overwriteAll(plan)).toEqual({ '2019-11': 'import' })
  })

  it('інше вхідне сальдо теж перезаписує', () => {
    expect(
      overwriteAll({
        ...plan,
        opening: { ...plan.opening, status: 'conflict' },
      })[OPENING_RESOLUTION_KEY]
    ).toBe('import')
  })
})

describe('CreatePayments', () => {
  it('показує, що буде перезаписано й пропущено, а потім створює з перезаписом', async () => {
    const value = setup()

    fireEvent.click(screen.getByText('Створити платежі'))

    await screen.findByText(/Буде перезаписано місяців: 1/)
    expect(planFn).toHaveBeenCalledWith({
      domainId: DOMAIN,
      companyId: COMPANY,
      statement,
    })
    expect(screen.getByText(/Пропущено місяців: 1/)).toBeInTheDocument()
    expect(
      screen.getByText(/Вже є в платежах і збігаються — без змін: 1/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getAllByText('Створити платежі')[1])

    await waitFor(() => expect(importFn).toHaveBeenCalledTimes(1))
    expect(importFn).toHaveBeenCalledWith({
      domainId: DOMAIN,
      companyId: COMPANY,
      statement,
      resolutions: { '2019-11': 'import' },
      source: 'Квартира №72',
    })
    // The table now reads October and November from payments; December,
    // skipped, keeps what was typed in.
    await waitFor(() =>
      expect(value.clearTypedFigures).toHaveBeenCalledWith(
        ['2019-10', '2019-11'],
        true
      )
    )
    expect(value.refetchPayments).toHaveBeenCalled()
  })

  it('без компанії кнопка вимкнена', () => {
    setup({ companyId: undefined })

    expect(
      screen.getByText('Створити платежі').closest('button')
    ).toBeDisabled()
  })
})
