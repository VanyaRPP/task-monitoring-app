import { render, screen } from '@testing-library/react'
import PriceList from './index'
import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: jest.fn(),
}))

jest.mock('@modules/hooks/useInvoiceCurrency', () => ({
  useInvoiceCurrency: jest.fn(),
}))

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn(),
}))

jest.mock(
  '@components/Forms/GroupedReceiptForm/GroupedPricesTable',
  () =>
    function MockGroupedPricesTable() {
      return <div data-testid="grouped-prices-table" />
    }
)

const mockedUsePaymentContext = usePaymentContext as jest.Mock
const mockedUseInvoiceCurrency = useInvoiceCurrency as jest.Mock

const buildPayment = (overrides: Record<string, any> = {}) => ({
  invoiceNumber: '42',
  invoiceCreationDate: '2026-01-01',
  currency: 'UAH',
  domain: { name: 'ТОВ «Український центр дуальної освіти»' },
  provider: {
    description:
      'ТОВ «Український центр дуальної освіти»\nIBAN: UA913052990000026007026412689\nРНОКПП: 42637285',
  },
  reciever: {
    companyName: 'ТОВ «Футбольний клуб «Полісся»»',
    description:
      'ТОВ «Футбольний клуб «Полісся»»\nUA153003350000000260082258383\nКод ЄДРПОУ 44547377',
    adminEmails: [],
  },
  invoice: [{ sum: 100 }],
  ...overrides,
})

describe('PriceList act intro paragraph', () => {
  beforeEach(() => {
    mockedUseInvoiceCurrency.mockReturnValue('UAH')
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: { companyName: undefined, domain: undefined },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })
  })

  it('states the customer and provider names without repeating their full requisites', () => {
    render(<PriceList data={buildPayment() as any} />)

    expect(
      screen.getByText((_, node) => {
        if (!node || node.tagName.toLowerCase() !== 'p') return false
        return (node.textContent ?? '').includes(
          'Ми, що нижче підписалися, Замовник — ТОВ «Футбольний клуб «Полісся»», з однієї сторони, та Виконавець — ТОВ «Український центр дуальної освіти», з іншої сторони, склали цей Акт про те, що відповідно до Договору Виконавцем надано, а Замовником прийнято такі послуги:'
        )
      })
    ).toBeInTheDocument()
  })

  it('does not repeat the customer/provider name inside the intro paragraph', () => {
    render(<PriceList data={buildPayment() as any} />)

    const introParagraph = screen.getByText((_, node) => {
      if (!node || node.tagName.toLowerCase() !== 'p') return false
      return (node.textContent ?? '').includes('Ми, що нижче підписалися')
    })

    const occurrences = (
      introParagraph.textContent?.match(/Футбольний клуб «Полісся»/g) || []
    ).length
    expect(occurrences).toBe(1)

    const providerOccurrences = (
      introParagraph.textContent?.match(/Український центр дуальної освіти/g) ||
      []
    ).length
    expect(providerOccurrences).toBe(1)

    expect(introParagraph.textContent).not.toContain('IBAN')
    expect(introParagraph.textContent).not.toContain('РНОКПП')
    expect(introParagraph.textContent).not.toContain('Код ЄДРПОУ')
  })

  it('renders the English intro paragraph without duplicated requisites when currency is not UAH', () => {
    mockedUseInvoiceCurrency.mockReturnValue('USD')
    render(<PriceList data={buildPayment({ currency: 'USD' }) as any} />)

    expect(
      screen.getByText((_, node) => {
        if (!node || node.tagName.toLowerCase() !== 'p') return false
        return (node.textContent ?? '').includes(
          'We, the undersigned, the Customer — ТОВ «Футбольний клуб «Полісся»», of the one part, and the Provider — ТОВ «Український центр дуальної освіти», of the other part, have executed this Act stating that, in accordance with the Agreement, the Provider has provided, and the Customer has accepted, the following services:'
        )
      })
    ).toBeInTheDocument()
  })
})
