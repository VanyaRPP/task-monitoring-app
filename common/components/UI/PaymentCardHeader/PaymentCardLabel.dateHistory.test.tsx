import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import PaymentCardLabel from '@components/UI/PaymentCardHeader/PaymentCardLabel'
import { AppRoutes } from '@utils/constants'
import { DATE_RANGE_HISTORY_STORAGE_KEY } from '@utils/dateRangeHistory'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@components/UI/PaymentCardHeader', () => ({
  ColumnSelect: () => null,
}))
jest.mock('@components/StreetsSelector', () => {
  const Mock = () => null
  Mock.displayName = 'StreetsSelector'
  return Mock
})
jest.mock('@components/UI/Reusable/FilterTags', () => ({
  CompanyFilterTags: () => null,
  DomainFilterTags: () => null,
}))

const item = (from: string, to: string, usedAt = 1) => ({ from, to, usedAt })

const seed = () =>
  window.localStorage.setItem(
    DATE_RANGE_HISTORY_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      scopes: {
        global: [item('2026-08-01', '2026-09-28')],
        'domain:A': [item('2025-01-01', '2025-12-31')],
        'domain:A,B': [item('2026-03-01', '2026-03-31')],
        'company:X': [item('2026-09-01', '2026-09-30')],
        'company:X,Y': [item('2026-01-05', '2026-01-10')],
      },
    })
  )

const renderLabel = (filters: Record<string, any> | undefined) =>
  render(
    <PaymentCardLabel
      enablePaymentsButton
      isAdmin
      filters={filters}
      setFilters={jest.fn()}
      onDateRangeChange={jest.fn()}
      onColumnsSelect={jest.fn()}
      streets={[]}
      domainFilter={[]}
      realEstatesFilter={[]}
    />
  )

const recentLabels = async () => {
  await userEvent.click(screen.getByPlaceholderText('Від'))
  const panel = await screen.findByRole('navigation', {
    name: 'Останні проміжки',
  })
  return within(panel)
    .queryAllByRole('button')
    .map((button) => button.textContent)
}

beforeEach(() => {
  ;(useRouter as jest.Mock).mockReturnValue({
    pathname: AppRoutes.PAYMENT,
    push: jest.fn(),
  })
  window.localStorage.clear()
  seed()
})

describe('PaymentCardLabel — scope історії проміжків', () => {
  it.each([
    ['без фільтрів → global', undefined, '01.08.2026 — 28.09.2026'],
    ['домен A → domain:A', { domain: ['A'] }, '2025 рік'],
    ['домени B+A → domain:A,B', { domain: ['B', 'A'] }, 'Березень 2026'],
    ['компанія X → company:X', { company: ['X'] }, 'Вересень 2026'],
    [
      'домен A + компанія X → company:X',
      { domain: ['A'], company: ['X'] },
      'Вересень 2026',
    ],
    [
      'компанії Y+X → company:X,Y',
      { company: ['Y', 'X'] },
      '05.01.2026 — 10.01.2026',
    ],
  ])('%s', async (_, filters, expected) => {
    renderLabel(filters)

    expect(await recentLabels()).toEqual([expected])
  })

  it('порожній scope показує власну (порожню) історію, а не global', async () => {
    renderLabel({ domain: ['C'] })

    expect(await recentLabels()).toEqual([])
    expect(
      await screen.findByText("Тут з'являться застосовані проміжки")
    ).toBeInTheDocument()
  })

  it('клік по запису передає range нагору для застосування', async () => {
    const onDateRangeChange = jest.fn()
    render(
      <PaymentCardLabel
        enablePaymentsButton
        isAdmin
        filters={{ company: ['X'] }}
        setFilters={jest.fn()}
        onDateRangeChange={onDateRangeChange}
        onColumnsSelect={jest.fn()}
        streets={[]}
        domainFilter={[]}
        realEstatesFilter={[]}
      />
    )
    await recentLabels()

    await userEvent.click(screen.getByRole('button', { name: 'Вересень 2026' }))

    await waitFor(() =>
      expect(onDateRangeChange).toHaveBeenCalledWith({
        dateFrom: '2026-09-01',
        dateTo: '2026-09-30',
      })
    )
  })
})

describe('PaymentCardLabel — сторінка окремого домену', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: AppRoutes.SEP_DOMAIN,
      push: jest.fn(),
    })
  })

  const renderSepDomain = (props: Record<string, any>) =>
    render(
      <PaymentCardLabel
        enablePaymentsButton={false}
        isAdmin
        filters={undefined}
        setFilters={jest.fn()}
        onDateRangeChange={jest.fn()}
        onColumnsSelect={jest.fn()}
        streets={[]}
        domainFilter={[]}
        realEstatesFilter={[]}
        {...props}
      />
    )

  it('показує RangePicker з історією переданого scope', async () => {
    renderSepDomain({ showDateRangeFilter: true, dateHistoryScope: 'domain:A' })

    expect(await recentLabels()).toEqual(['2025 рік'])
  })

  it('не показує RangePicker, якщо його не ввімкнули', () => {
    renderSepDomain({})

    expect(screen.queryByPlaceholderText('Від')).not.toBeInTheDocument()
  })
})
