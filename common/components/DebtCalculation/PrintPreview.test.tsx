import { buildDebtCalculationInput } from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import { buildDebtCalculationDocument } from '@utils/excel/debt-calculation-excel'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import DebtDocumentTable, { formatCell } from './DebtDocumentTable'
import PrintPreview from './PrintPreview'

const mockPrint = jest.fn()
const mockUseReactToPrint = jest.fn((_options: unknown) => mockPrint)
jest.mock('react-to-print', () => ({
  useReactToPrint: (options: unknown) => mockUseReactToPrint(options),
}))

// A made-up flat: two months of debt with inflation.
const result = calculateDebt(
  buildDebtCalculationInput({
    company: { totalArea: 54.2, pricePerMeter: 6.1 },
    from: { year: 2025, month: 11 },
    to: { year: 2026, month: 1 },
    indexByPeriod: { '2025-11': 100.8, '2025-12': 100.4, '2026-01': 101.1 },
    overrides: { openingDebt: 4217.35 },
  })
)

const context = {
  company: {
    _id: 'apt-7',
    companyName: 'Квартира №7',
    description: 'о/р 777',
  },
  result,
  overrides: { openingDebt: 4217.35 },
  from: dayjs('2025-11-01'),
  to: dayjs('2026-01-01'),
  annualRatePercent: 3,
  inflationMethod: 'balance',
} as unknown as IDebtCalculationContext

const document = buildDebtCalculationDocument({
  companyName: 'Квартира №7',
  description: 'о/р 777',
  domainName: 'ОСББ Тестове',
  result,
  from: { year: 2025, month: 11 },
  to: { year: 2026, month: 1 },
  annualRatePercent: 3,
  inflationMethod: 'balance',
  area: 54.2,
  tariff: 6.1,
  openingDebt: 4217.35,
})

describe('formatCell', () => {
  it('shows numbers the way the Excel format does', () => {
    expect(formatCell({ v: 4217.35, numFmt: '0.00' })).toBe('4217,35')
    expect(formatCell({ v: 12, numFmt: '0.00' })).toBe('12,00')
    expect(formatCell({ v: 1.0123456, numFmt: '0.000000' })).toBe('1,012346')
    expect(formatCell({ v: 31 })).toBe('31')
    expect(formatCell({ v: 'Листопад 2025' })).toBe('Листопад 2025')
  })
})

describe('DebtDocumentTable', () => {
  it('prints every cell of the Excel document, in its row and order', () => {
    const { container } = render(<DebtDocumentTable document={document} />)

    const rendered = Array.from(container.querySelectorAll('tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td'))
        .map((td) => td.textContent)
        .filter(Boolean)
    )
    const expected = document.rows.map((line) =>
      line.filter(Boolean).map(formatCell).filter(Boolean)
    )
    expect(rendered).toEqual(expected)
  })

  it('merges, bolds and fills cells as the Excel file does', () => {
    const { container } = render(<DebtDocumentTable document={document} />)
    const cells = Array.from(container.querySelectorAll('td'))

    const head = cells.find((td) => td.textContent === 'Вхідне сальдо')
    expect(head).toHaveStyle({ fontWeight: '600', background: '#DDE5F0' })

    const merged = cells.find((td) => Number(td.getAttribute('colspan')) > 1)
    expect(merged).toBeDefined()
    // Every row still spans exactly the document's columns.
    container.querySelectorAll('tr').forEach((tr) => {
      const width = Array.from(tr.querySelectorAll('td')).reduce(
        (sum, td) => sum + Number(td.getAttribute('colspan') ?? 1),
        0
      )
      expect(width).toBe(document.columns.length)
    })
  })
})

describe('PrintPreview', () => {
  const renderButton = (value = context) =>
    render(
      <DebtCalculationContext.Provider value={value}>
        <PrintPreview domainName="ОСББ Тестове" />
      </DebtCalculationContext.Provider>
    )

  beforeEach(() => {
    mockPrint.mockClear()
    mockUseReactToPrint.mockClear()
  })

  it('shows the calculation first, and prints it from the preview', async () => {
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: /Друк/ }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText('Перегляд перед друком')
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Квартира №7')).toBeInTheDocument()
    expect(mockPrint).not.toHaveBeenCalled()

    await userEvent.click(
      within(dialog).getByRole('button', { name: /Друкувати/ })
    )
    expect(mockPrint).toHaveBeenCalledTimes(1)
    // The PDF the dialog saves is named like the Excel file.
    expect(mockUseReactToPrint).toHaveBeenLastCalledWith(
      expect.objectContaining({
        documentTitle: 'Розрахунок-заборгованості_Квартира-№7_2025-11_2026-01',
      })
    )
  })

  it('opens nothing while there is no calculation', async () => {
    renderButton({ ...context, result: undefined } as IDebtCalculationContext)

    await userEvent.click(screen.getByRole('button', { name: /Друк/ }))

    expect(await screen.findByText(/Немає що друкувати/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
