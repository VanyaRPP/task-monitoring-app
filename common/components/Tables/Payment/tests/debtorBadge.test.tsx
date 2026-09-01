import React from 'react'
import { render, renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePaymentColumns, CompanyWithPayments } from '../usePaymentColumns'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

const company = { _id: 'company1', companyName: 'Company A' }

const makeDebtor = (totalDebt: number): CompanyWithPayments => ({
  companyId: 'company1',
  companyName: 'Company A',
  debtPerMonth: [],
  totalDebt,
})

const renderCompanyCell = ({
  debtorCompanies,
  isUser = false,
}: {
  debtorCompanies: CompanyWithPayments[]
  isUser?: boolean
}) => {
  const { result } = renderHook(() =>
    usePaymentColumns({
      sepDomainID: undefined,
      filters: undefined,
      setFilters: jest.fn(),
      domainsFilter: [],
      companiesFilter: [
        { text: 'Company A', value: 'company1' },
        { text: 'Company B', value: 'company2' },
      ] as any,
      dateFilters: undefined,
      debtorCompanies,
      selectedColumns: [],
      payments: { data: [{ company }] } as any,
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser,
      onViewClick: jest.fn(),
      onEditClick: jest.fn(),
      onDelete: jest.fn(),
      onMarkPaid: jest.fn(),
      onDuplicate: jest.fn(),
      onSendPaymentEmail: jest.fn(),
      onUpdatePaymentStatus: jest.fn(),
      deleteLoading: false,
    })
  )

  const companyColumn = result.current.find(
    (column: any) => column.title === 'Компанія'
  ) as any

  return render(<>{companyColumn.render(company, {} as any, 0)}</>)
}

// antd renders its preset colors as `ant-badge-color-*` classes and anything
// else as an inline background, so check both.
const badgeColor = () => {
  const el = document.querySelector('.ant-badge-count') as HTMLElement
  if (!el) return undefined
  const preset = Array.from(el.classList).find((c) =>
    c.startsWith('ant-badge-color-')
  )
  return preset ? preset.replace('ant-badge-color-', '') : el.style.background
}

// antd splits the count into one span per character, so read the whole node.
const badgeCount = () => document.querySelector('.ant-badge-count')?.textContent

describe('payments company column debtor badge', () => {
  it('shows the debt amount when the company owes the domain', () => {
    renderCompanyCell({ debtorCompanies: [makeDebtor(1500)] })

    expect(badgeCount()).toBe('1500.00')
    expect(badgeColor()).toBe('gray')
  })

  it('shows a signed amount when the domain owes the company', () => {
    renderCompanyCell({ debtorCompanies: [makeDebtor(-1500)] })

    expect(badgeCount()).toBe('-1500.00')
  })

  it('colors the two debt directions differently', () => {
    const positive = renderCompanyCell({
      debtorCompanies: [makeDebtor(-25000)],
    })
    const negativeColor = badgeColor()
    positive.unmount()

    renderCompanyCell({ debtorCompanies: [makeDebtor(25000)] })

    expect(negativeColor).toBe('geekblue')
    expect(badgeColor()).toBe('red')
  })

  it.each([
    ['positive', 0.5],
    ['negative', -0.5],
  ])('hides a %s debt below the 1 threshold', (_name, totalDebt) => {
    renderCompanyCell({ debtorCompanies: [makeDebtor(totalDebt as number)] })

    expect(document.querySelector('.ant-badge-count')).toBeNull()
  })

  it.each([
    ['positive', 1500],
    ['negative', -1500],
  ])('hides a %s debt from regular users', (_name, totalDebt) => {
    renderCompanyCell({
      debtorCompanies: [makeDebtor(totalDebt as number)],
      isUser: true,
    })

    expect(document.querySelector('.ant-badge-count')).toBeNull()
  })

  it('renders no badge when the company has no debt record', () => {
    renderCompanyCell({ debtorCompanies: [] })

    expect(document.querySelector('.ant-badge-count')).toBeNull()
  })
})
