import { buildDebtCalculationInput } from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import { interop, useExportExcel } from './useExportExcel'

/**
 * Обидва пакети підміняємо у формі, яку віддає ВЕБПАК для CJS-бандла:
 * `{ __esModule: true, default: <модуль> }`. Саме на ній експорт і падав, бо
 * Jest сам по собі транспілює `import()` у `require()` і такої обгортки не
 * створює — без цього мока регресія не ловиться.
 */
jest.mock('xlsx-js-style', () => ({
  __esModule: true,
  default: jest.requireActual('xlsx-js-style'),
}))

jest.mock('file-saver', () => ({
  __esModule: true,
  default: { saveAs: jest.fn() },
}))

const getSaveAs = (): jest.Mock =>
  (jest.requireMock('file-saver') as { default: { saveAs: jest.Mock } }).default
    .saveAs

const result = calculateDebt(
  buildDebtCalculationInput({
    company: { totalArea: 67.08, pricePerMeter: 5.25 },
    from: { year: 2026, month: 1 },
    to: { year: 2026, month: 3 },
    indexByPeriod: { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 },
    overrides: { openingDebt: 8371.52 },
  })
)

const Harness: React.FC<{ domainName?: string }> = ({ domainName }) => {
  const { exportExcel, isExporting } = useExportExcel(domainName)

  return (
    <button onClick={exportExcel} disabled={isExporting}>
      Експорт
    </button>
  )
}

const DOMAIN_NAME = 'ОСББ Крошенська 8'

// Без дефолту в параметрі: передане `undefined` його б не перекрило.
const renderHarness = (
  patch: Partial<IDebtCalculationContext> = {},
  domainName?: string
) =>
  render(
    <DebtCalculationContext.Provider
      value={
        {
          companies: [
            {
              _id: 'apt-1',
              companyName: 'Квартира №18',
              description: 'о/р 123',
            },
          ],
          results: { 'apt-1': result },
          from: dayjs('2026-01-01'),
          to: dayjs('2026-03-01'),
          annualRatePercent: 3,
          inflationMethod: 'balance',
          ...patch,
        } as IDebtCalculationContext
      }
    >
      <Harness domainName={domainName} />
    </DebtCalculationContext.Provider>
  )

beforeEach(() => {
  getSaveAs().mockClear()
})

describe('interop', () => {
  it('розгортає вебпаківську обгортку CJS-модуля', () => {
    const real = { utils: 'справжній' }

    expect(interop({ default: real } as never)).toBe(real)
  })

  it('пропускає модуль, відданий напряму (як у Jest)', () => {
    const real = { utils: 'справжній' }

    expect(interop(real as never)).toBe(real)
  })

  it('не падає на undefined', () => {
    expect(interop(undefined as never)).toBeUndefined()
  })
})

describe('useExportExcel', () => {
  it('формує файл і віддає його в saveAs', async () => {
    renderHarness({}, DOMAIN_NAME)

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(getSaveAs()).toHaveBeenCalledTimes(1))

    const [blob, fileName] = getSaveAs().mock.calls[0]
    expect(blob).toBeInstanceOf(Blob)
    // Порожній або однобайтовий blob означав би, що книга не зібралась.
    expect(blob.size).toBeGreaterThan(1000)
    expect(fileName).toBe(
      'Розрахунок-заборгованості_ОСББ-Крошенська-8_2026-01_2026-03.xlsx'
    )
  })

  it('обходиться без назви домену в імені файлу', async () => {
    renderHarness({}, undefined)

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(getSaveAs()).toHaveBeenCalled())
    expect(getSaveAs().mock.calls[0][1]).toBe(
      'Розрахунок-заборгованості_2026-01_2026-03.xlsx'
    )
  })

  it('не формує файл, коли немає квартир', async () => {
    renderHarness({ companies: [], results: {} })

    await userEvent.click(screen.getByRole('button'))

    expect(await screen.findByText(/Немає що експортувати/)).toBeInTheDocument()
    expect(getSaveAs()).not.toHaveBeenCalled()
  })

  it('пропускає квартири без порахованих місяців', async () => {
    renderHarness({
      companies: [
        { _id: 'apt-1', companyName: 'Порожня' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
      results: { 'apt-1': { ...result, rows: [] } },
    })

    await userEvent.click(screen.getByRole('button'))

    expect(await screen.findByText(/Немає що експортувати/)).toBeInTheDocument()
    expect(getSaveAs()).not.toHaveBeenCalled()
  })

  it('показує причину збою, а не мовчить', async () => {
    const saveAs = getSaveAs()
    saveAs.mockImplementationOnce(() => {
      throw new Error('диск переповнений')
    })
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    renderHarness({}, DOMAIN_NAME)

    await userEvent.click(screen.getByRole('button'))

    expect(await screen.findByText(/диск переповнений/)).toBeInTheDocument()
    expect(console.error).toHaveBeenCalled()
    ;(console.error as jest.Mock).mockRestore()
  })
})
