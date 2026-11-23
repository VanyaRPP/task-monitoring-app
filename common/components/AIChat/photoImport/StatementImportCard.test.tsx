import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useImportDebtCalculationMutation } from '@common/api/debtCalculationApi/debtCalculation.api'
import { DEBT_IMPORTED_EVENT } from '@common/components/DebtCalculation/importEvents'
import StatementImportCard from './StatementImportCard'
import type { IStatementGroup } from './grouping'

jest.mock('@common/api/debtCalculationApi/debtCalculation.api', () => ({
  useImportDebtCalculationMutation: jest.fn(),
}))
jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useGetAllRealEstateQuery: jest.fn(() => ({
    data: { data: [] },
    isFetching: false,
  })),
}))

const candidate = {
  id: '507f1f77bcf86cd799439012',
  companyName: 'Квартира №72',
  domainId: '507f1f77bcf86cd799439011',
  domainName: 'ОСББ',
}

const row = (
  month: number,
  opening: number,
  correction: number,
  charged: number,
  paid: number
) => ({
  year: 2019,
  month,
  opening,
  correction,
  charged,
  paid,
  closing: Math.round((opening - correction + charged - paid) * 100) / 100,
})

const group: IStatementGroup = {
  key: 'g1',
  photoNames: ['1.jpg', '2.jpg'],
  header: {
    address: 'вул. Покровська буд. 149 кв. 72',
    apartment: null,
    ownerName: null,
    accountNumber: null,
  },
  candidates: [candidate],
  suggestedCompanyId: candidate.id,
  // As printed: the 6,86 correction lowers the debt.
  rows: [row(10, 16616.69, 0, 424.46, 400), row(11, 16641.15, 6.86, 424.46, 0)],
  issues: [
    {
      kind: 'autocorrected',
      period: '2019-10',
      message: '2019-10: оплату взято з сальдо',
    },
  ],
  correctionSign: -1,
}

const fill = jest.fn()

const setup = (card = {}) => {
  const onChange = jest.fn()
  render(
    <StatementImportCard
      group={group}
      card={{
        companyId: candidate.id,
        domainId: candidate.domainId,
        ...card,
      }}
      onChange={onChange}
    />
  )
  return onChange
}

beforeEach(() => {
  jest.clearAllMocks()
  fill.mockResolvedValue({ data: {} })
  ;(useImportDebtCalculationMutation as jest.Mock).mockReturnValue([
    fill,
    { isLoading: false, error: undefined },
  ])
})

describe('StatementImportCard', () => {
  it('заповнює розрахунок місяцями з фото: коректура — зі знаком для боргу', async () => {
    const onImported = jest.fn()
    window.addEventListener(DEBT_IMPORTED_EVENT, onImported)
    const onChange = setup()

    fireEvent.click(screen.getByText('Заповнити розрахунок'))

    await waitFor(() => expect(fill).toHaveBeenCalledTimes(1))
    expect(fill).toHaveBeenCalledWith({
      domainId: candidate.domainId,
      companyId: candidate.id,
      openingDebt: 16616.69,
      rows: [
        { year: 2019, month: 10, charged: 424.46, correction: 0, paid: 400 },
        { year: 2019, month: 11, charged: 424.46, correction: -6.86, paid: 0 },
      ],
    })
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ filled: { months: 2 } })
    )
    // An open debt page must reload instead of autosaving over the import.
    expect(onImported).toHaveBeenCalledTimes(1)
    window.removeEventListener(DEBT_IMPORTED_EVENT, onImported)
  })

  it('після заповнення — посилання на розрахунок і що робити далі', () => {
    setup({ filled: { months: 93 } })

    expect(
      screen.getByText(/Розрахунок заповнено: 93 місяці/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Відкрити розрахунок заборгованості')
    ).toHaveAttribute(
      'href',
      `/debt-calculation?domainId=${candidate.domainId}&companyId=${candidate.id}`
    )
    expect(screen.getByText(/«Створити платежі»/)).toBeInTheDocument()
  })

  it('без компанії не дає заповнити', () => {
    setup({ companyId: undefined, domainId: undefined })

    expect(
      screen.getByText('Заповнити розрахунок').closest('button')
    ).toBeDisabled()
  })

  it('показує, що виправлено за сальдо', () => {
    setup()

    expect(screen.getByText('Виправлено за сальдо: 1')).toBeInTheDocument()
  })
})
