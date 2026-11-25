import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ElectricityChart from './index'

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))

jest.mock('@modules/hooks/useTheme', () => ({
  __esModule: true,
  default: () => ['light', jest.fn()],
}))

type LineProps = {
  data: { month: string; consumed: number | null }[]
  yField: string
  tooltip: {
    items: ((row: unknown) => { name: string; value: string })[]
  }
}

let mockLines: Record<string, LineProps> = {}

// The canvas chart itself does not render in jsdom: its input is what matters.
jest.mock(
  'next/dynamic',
  () => () =>
    function LineStub(props: LineProps) {
      mockLines[props.yField] = props
      return <div data-testid={`line-${props.yField}`} />
    }
)

const street = (id: string, address: string) => ({
  _id: id,
  address,
  city: 'Житомир',
})

const monthService = (
  id: string,
  month: string,
  consumed: number,
  at: ReturnType<typeof street>
) => ({
  _id: id,
  date: `${month}-01T12:00:00Z`,
  street: at,
  electricityPrice: 12,
  consumedElectricity: consumed,
  generalElectricity: consumed * 11,
  losses: 10,
})

const first = street('street-1', 'Шевченка 1')
const second = street('street-2', 'Франка 2')

const query = jest.mocked(useGetAllServicesQuery)

const domains = [{ text: 'Домен А', value: 'domain-a' }]

const open = async (preferredStreetId?: string) => {
  render(
    <ElectricityChart domains={domains} preferredStreetId={preferredStreetId} />
  )
  await userEvent.click(screen.getByText('Електропостачання'))
}

const legendButton = (name: string) => screen.getByRole('button', { name })

describe('ElectricityChart', () => {
  beforeEach(() => {
    mockLines = {}
    query.mockReset()
    query.mockReturnValue({
      currentData: {
        data: [
          monthService('3', '2026-03', 300, first),
          monthService('2', '2026-03', 999, second),
          monthService('1', '2026-02', 200, first),
        ],
      },
      isFetching: false,
      isError: false,
    } as any)
  })

  it('loads nothing until it is opened', () => {
    render(<ElectricityChart domains={domains} />)

    expect(query).not.toHaveBeenCalled()
  })

  it('shows the address of the newest service, one panel per metric', async () => {
    await open()

    expect(query).toHaveBeenLastCalledWith(
      { domainId: 'domain-a', limit: 0 },
      { skip: false }
    )
    expect(screen.getByTitle('Шевченка 1 (м. Житомир)')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^line-/)).toHaveLength(4)
    expect(mockLines.consumed.data.map((row) => row.consumed)).toEqual([
      200, 300,
    ])
  })

  it('starts from the address picked in the table filter', async () => {
    await open('street-2')

    expect(mockLines.consumed.data.map((row) => row.consumed)).toEqual([999])
  })

  it('hides a metric through the legend and brings it back', async () => {
    await open()

    await userEvent.click(legendButton('Спожито'))

    expect(legendButton('Спожито')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByTestId('line-consumed')).not.toBeInTheDocument()
    expect(mockLines.losses.tooltip.items).toHaveLength(3)

    await userEvent.click(legendButton('Спожито'))

    expect(screen.getByTestId('line-consumed')).toBeInTheDocument()
  })

  it('says so when every metric is hidden', async () => {
    await open()

    for (const name of [
      'Тариф',
      'Всього з ПДВ',
      'Спожито',
      'Втрати в трансформаторі, лініях, реактивна',
    ]) {
      await userEvent.click(legendButton(name))
    }

    expect(screen.getByText('Усі показники приховані')).toBeInTheDocument()
  })

  it('switches the tariff and the total to the figures without VAT', async () => {
    await open()

    expect(screen.getByTestId('line-tariffWithVat')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Без ПДВ'))

    expect(screen.getByTestId('line-tariffWithoutVat')).toBeInTheDocument()
    expect(screen.getByTestId('line-totalWithoutVat')).toBeInTheDocument()
    expect(screen.queryByTestId('line-tariffWithVat')).not.toBeInTheDocument()
    expect(legendButton('Всього без ПДВ')).toBeInTheDocument()
  })

  it('lists every metric of the month in a tooltip', async () => {
    await open()

    const { data, tooltip } = mockLines.consumed
    const items = tooltip.items.map((item) => item(data[1]))

    expect(items.map(({ name, value }) => [name, value])).toEqual([
      ['Тариф, грн/кВт', '12'],
      ['Всього з ПДВ, грн', expect.stringMatching(/^3\s960$/)],
      ['Спожито, кВт', '300'],
      ['Втрати в трансформаторі, лініях, реактивна, %', '10'],
    ])
  })

  it('shows an empty state for a domain without services', async () => {
    query.mockReturnValue({
      currentData: { data: [] },
      isFetching: false,
      isError: false,
    } as any)

    await open()

    expect(
      screen.getByText('Немає даних за обраний період')
    ).toBeInTheDocument()
  })
})
