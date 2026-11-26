import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TariffsChart from './index'

jest.mock('@common/api/serviceApi/service.api', () => ({
  useGetAllServicesQuery: jest.fn(),
}))

jest.mock('@modules/hooks/useTheme', () => ({
  __esModule: true,
  default: () => ['light', jest.fn()],
}))

// The canvas chart itself does not render in jsdom.
jest.mock(
  'next/dynamic',
  () => () =>
    function LineStub() {
      return <div data-testid="line" />
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
  at: ReturnType<typeof street>,
  prices: Record<string, number>
) => ({
  _id: id,
  date: `${month}-01T12:00:00Z`,
  street: at,
  customServices: Object.entries(prices).map(([label, price]) => ({
    _id: label,
    fieldName: label,
    label,
    price,
  })),
})

const first = street('street-1', 'Шевченка 1')
const second = street('street-2', 'Франка 2')

const byDomain: Record<string, unknown[]> = {
  'domain-a': [
    monthService('3', '2026-02', first, { Охорона: 550, Ліфт: 0 }),
    monthService('2', '2026-02', second, { Паркінг: 900 }),
    monthService('1', '2026-01', first, { Охорона: 500, Ліфт: 0 }),
  ],
  'domain-b': [monthService('4', '2026-02', first, { Інтернет: 200 })],
}

const query = jest.mocked(useGetAllServicesQuery)

const domains = [
  { text: 'Домен А', value: 'domain-a' },
  { text: 'Домен Б', value: 'domain-b' },
]

const open = async (
  props: Partial<Parameters<typeof TariffsChart>[0]> = {}
) => {
  render(<TariffsChart domains={domains} {...props} />)
  await userEvent.click(screen.getByText('Тарифи послуг'))
}

const cards = () =>
  screen.queryAllByRole('region').map((card) => card.getAttribute('aria-label'))

describe('TariffsChart', () => {
  beforeEach(() => {
    query.mockReset()
    query.mockImplementation(
      (args: any) =>
        ({
          currentData: { data: byDomain[args.domainId] },
          isFetching: false,
          isError: false,
        }) as any
    )
  })

  it('loads nothing until it is opened', () => {
    render(<TariffsChart domains={domains} />)

    expect(query).not.toHaveBeenCalled()
  })

  it('has a card with the latest tariff and its change per service', async () => {
    await open()

    // the open Collapse panel is a region too, without a label of its own
    const card = screen.getByRole('region', { name: 'Охорона' })

    expect(within(card).getByText('550')).toBeInTheDocument()
    expect(within(card).getByText('за 02.2026')).toBeInTheDocument()
    expect(within(card).getByText('↑ 50 (+10 %) з 01.2026')).toBeInTheDocument()
    expect(within(card).getByTestId('line')).toBeInTheDocument()
    expect(screen.getAllByTestId('line')).toHaveLength(1)
    expect(
      screen.getByText('Без тарифу за цей період: Ліфт')
    ).toBeInTheDocument()
  })

  it('starts from the domain and address picked in the table filter', async () => {
    await open({
      preferredDomainId: 'domain-a',
      preferredStreetId: 'street-2',
    })

    expect(cards()).toContain('Паркінг')
    expect(cards()).not.toContain('Охорона')
  })

  it('swaps the set of services together with the domain', async () => {
    await open()

    await userEvent.click(screen.getByRole('combobox', { name: 'Домен' }))
    await userEvent.click(screen.getByTitle('Домен Б'))

    expect(cards()).toContain('Інтернет')
    expect(cards()).not.toContain('Охорона')
  })

  it('shows an empty state for a domain without services', async () => {
    query.mockReturnValue({
      currentData: { data: [] },
      isFetching: false,
      isError: false,
    } as any)

    await open()

    expect(
      screen.getByText('Немає тарифів за обраний період')
    ).toBeInTheDocument()
  })

  it('reports a failed request', async () => {
    query.mockReturnValue({ isFetching: false, isError: true } as any)

    await open()

    expect(screen.getByText('Помилка завантаження даних')).toBeInTheDocument()
  })
})

describe('TariffsChart: arranging the cards', () => {
  beforeEach(() => {
    query.mockReset()
    query.mockImplementation(
      (args: any) =>
        ({
          currentData: { data: byDomain[args.domainId] },
          isFetching: false,
          isError: false,
        }) as any
    )
  })

  const open = async () => {
    render(<TariffsChart domains={domains} />)
    await userEvent.click(screen.getByText('Тарифи послуг'))
  }
  const card = (name: string) => screen.getByRole('region', { name })
  const button = (name: string) => screen.getByRole('button', { name })
  const enlarged = () =>
    screen
      .queryAllByRole('region')
      .filter((item) => item.getAttribute('aria-current') === 'true')
      .map((item) => item.getAttribute('aria-label'))
  const reset = () => button('undo Скинути')

  // Two services at the first address of the first domain.
  beforeEach(() => {
    byDomain['domain-a'] = [
      monthService('1', '2026-01', first, { Охорона: 500, Паркінг: 900 }),
    ]
  })

  it('enlarges the clicked card and moves on to the next one clicked', async () => {
    await open()
    expect(enlarged()).toEqual([])

    await userEvent.click(card('Охорона'))
    expect(enlarged()).toEqual(['Охорона'])

    await userEvent.click(card('Паркінг'))
    expect(enlarged()).toEqual(['Паркінг'])
  })

  it('keeps the enlarged card on a single click', async () => {
    await open()
    await userEvent.click(card('Охорона'))

    await userEvent.click(card('Охорона'))

    expect(enlarged()).toEqual(['Охорона'])
  })

  it('shrinks the enlarged card on a double click', async () => {
    await open()
    await userEvent.click(card('Охорона'))

    await userEvent.dblClick(card('Охорона'))

    expect(enlarged()).toEqual([])
  })

  // In a browser the layout has moved by the second click of a double click:
  // it lands on whatever took the place under the cursor.
  it('stays enlarged when a double click that began in the grid ends on it', async () => {
    await open()
    await userEvent.click(card('Охорона'))

    fireEvent.click(card('Охорона'), { detail: 2 })
    fireEvent.doubleClick(card('Охорона'))

    expect(enlarged()).toEqual(['Охорона'])
  })

  it('does not move on when that second click ends on another card', async () => {
    await open()
    await userEvent.click(card('Охорона'))

    fireEvent.click(card('Паркінг'), { detail: 2 })

    expect(enlarged()).toEqual(['Охорона'])
  })

  it('enlarges and shrinks through the buttons of the card', async () => {
    await open()

    await userEvent.click(button('Збільшити «Паркінг»'))
    expect(enlarged()).toEqual(['Паркінг'])

    await userEvent.click(button('Зменшити «Паркінг»'))
    expect(enlarged()).toEqual([])
  })

  it('puts a service away and brings it back by name', async () => {
    await open()

    await userEvent.click(button('Приховати «Охорона»'))

    expect(cards()).not.toContain('Охорона')
    // the eye must not enlarge anything on its way
    expect(enlarged()).toEqual([])

    await userEvent.click(button('Показати «Охорона»'))

    expect(cards()).toContain('Охорона')
    expect(screen.queryByText('Приховані:')).not.toBeInTheDocument()
  })

  it('returns to the grid when the enlarged service is hidden', async () => {
    await open()
    await userEvent.click(card('Охорона'))

    await userEvent.click(button('Приховати «Охорона»'))

    expect(enlarged()).toEqual([])
    expect(cards()).toContain('Паркінг')
  })

  it('resets both the enlarged card and the hidden services', async () => {
    await open()
    expect(reset()).toBeDisabled()

    await userEvent.click(button('Приховати «Охорона»'))
    await userEvent.click(card('Паркінг'))
    await userEvent.click(reset())

    expect(enlarged()).toEqual([])
    expect(cards()).toEqual(expect.arrayContaining(['Охорона', 'Паркінг']))
    expect(reset()).toBeDisabled()
  })

  it('says so when every service is hidden', async () => {
    await open()

    await userEvent.click(button('Приховати «Охорона»'))
    await userEvent.click(button('Приховати «Паркінг»'))

    expect(screen.getByText('Усі послуги приховані')).toBeInTheDocument()
    expect(reset()).toBeEnabled()
  })

  it('keeps a view of its own for every domain', async () => {
    byDomain['domain-b'] = [
      monthService('4', '2026-02', first, { Охорона: 200 }),
    ]
    const pickDomain = async (name: string) => {
      await userEvent.click(screen.getByRole('combobox', { name: 'Домен' }))
      await userEvent.click(
        document.querySelector(`.ant-select-item-option[title="${name}"]`)
      )
    }
    await open()
    await userEvent.click(button('Приховати «Охорона»'))

    await pickDomain('Домен Б')
    expect(cards()).toContain('Охорона')

    await pickDomain('Домен А')
    expect(cards()).not.toContain('Охорона')
  })
})
