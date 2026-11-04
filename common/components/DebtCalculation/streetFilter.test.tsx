import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DebtCalculationContext, IDebtCalculationContext } from './'
import DebtCalculationHeader from './Header'

jest.mock('@common/api/domainApi/domain.api', () => ({
  useGetDomainsQuery: jest.fn(),
}))
// Not under test here.
jest.mock('./CreatePayments', () => () => null)
jest.mock('./PrintPreview', () => () => null)
jest.mock('./useExportExcel', () => ({
  useExportExcel: () => ({ exportExcel: jest.fn(), isExporting: false }),
}))

const SHEVCHENKA = { _id: 'st-1', address: 'вул. Шевченка 8', city: 'Львів' }
const LESI = { _id: 'st-2', address: 'вул. Лесі Українки 3', city: 'Львів' }

// Made-up flats of one HOA: two on one street, one on another, one without.
const COMPANIES = [
  { _id: 'c-1', companyName: 'Квартира №1', street: SHEVCHENKA },
  { _id: 'c-2', companyName: 'Квартира №2', street: SHEVCHENKA },
  { _id: 'c-3', companyName: 'Квартира №3', street: LESI },
  { _id: 'c-4', companyName: 'Комора', street: null },
]

/** The options of the dropdown open right now. */
const openOptions = (): HTMLElement[] => {
  const open = Array.from(
    document.querySelectorAll<HTMLElement>('.ant-select-dropdown')
  ).filter((dropdown) => !dropdown.className.includes('hidden'))
  return Array.from(
    open.at(-1)?.querySelectorAll<HTMLElement>('.ant-select-item-option') ?? []
  )
}

const close = async (): Promise<void> => {
  await userEvent.click(document.body)
}

const choose = async (select: string, option: RegExp): Promise<void> => {
  await userEvent.click(screen.getByRole('combobox', { name: select }))
  const target = openOptions().find((element) =>
    option.test(element.getAttribute('title') ?? '')
  )
  if (!target) throw new Error(`no option ${option} in «${select}»`)
  await userEvent.click(target)
  await close()
}

const optionsOf = async (select: string): Promise<string[]> => {
  await userEvent.click(screen.getByRole('combobox', { name: select }))
  const titles = openOptions().map((option) => option.getAttribute('title'))
  await close()
  return titles
}

const setDomainId = jest.fn()

const Harness: React.FC<{ initialCompanyId?: string }> = ({
  initialCompanyId,
}) => {
  const [companyId, setCompanyId] = useState(initialCompanyId)
  return (
    <DebtCalculationContext.Provider
      value={
        {
          domainId: 'd-1',
          setDomainId,
          allowedDomainIds: ['d-1', 'd-2'],
          companies: COMPANIES,
          companyId,
          setCompanyId,
          annualRatePercent: 3,
          inflationMethod: 'balance',
        } as unknown as IDebtCalculationContext
      }
    >
      <DebtCalculationHeader />
      <output data-testid="company">{companyId ?? '—'}</output>
    </DebtCalculationContext.Provider>
  )
}

beforeEach(() => {
  setDomainId.mockClear()
  ;(useGetDomainsQuery as jest.Mock).mockReturnValue({
    data: [
      { _id: 'd-1', name: 'ОСББ Тестове' },
      { _id: 'd-2', name: 'ОСББ Друге' },
    ],
  })
})

describe('address filter', () => {
  it('lists the addresses with their company counts, «Без адреси» last', async () => {
    render(<Harness />)

    expect(await optionsOf('Адреса')).toEqual([
      'вул. Лесі Українки 3 (м. Львів) — 1',
      'вул. Шевченка 8 (м. Львів) — 2',
      'Без адреси — 1',
    ])
  })

  it('starts on the first address and its first company', async () => {
    render(<Harness />)

    expect(await optionsOf('Компанія')).toEqual(['Квартира №3'])
    expect(screen.getByTestId('company')).toHaveTextContent('c-3')
  })

  it('starts on the address of a company that is already chosen', async () => {
    render(<Harness initialCompanyId="c-4" />)

    expect(await optionsOf('Компанія')).toEqual(['Комора'])
    expect(screen.getByTestId('company')).toHaveTextContent('c-4')
  })

  it('narrows the companies to the chosen address', async () => {
    render(<Harness />)

    await choose('Адреса', /^вул\. Шевченка 8/)

    expect(await optionsOf('Компанія')).toEqual(['Квартира №1', 'Квартира №2'])
  })

  it('does not pick an address again once it is cleared by hand', async () => {
    render(<Harness />)

    await userEvent.hover(screen.getByRole('combobox', { name: 'Адреса' }))
    await userEvent.click(
      document.querySelector<HTMLElement>('.ant-select-clear')
    )

    expect(await optionsOf('Компанія')).toHaveLength(4)
  })

  it('drops a company that is not at the chosen address, keeps one that is', async () => {
    render(<Harness initialCompanyId="c-1" />)

    await choose('Адреса', /^вул\. Шевченка 8/)
    expect(screen.getByTestId('company')).toHaveTextContent('c-1')

    await choose('Адреса', /^вул\. Лесі Українки/)
    expect(screen.getByTestId('company')).toHaveTextContent('—')
  })

  it('starts over with all addresses when the provider changes', async () => {
    render(<Harness />)
    await choose('Адреса', /^Без адреси/)
    expect(await optionsOf('Компанія')).toEqual(['Комора'])

    await choose('Домен', /^ОСББ Друге$/)

    expect(setDomainId).toHaveBeenCalledWith('d-2')
    expect(await optionsOf('Компанія')).toHaveLength(4)
  })
})
