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

const getIntroParagraph = () =>
  screen.getByText((_, node) => {
    if (!node || node.tagName.toLowerCase() !== 'p') return false
    const text = node.textContent ?? ''
    return (
      text.includes('Ми, що нижче підписалися') ||
      text.includes('We, the undersigned')
    )
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

    const introParagraph = getIntroParagraph()

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

describe('PriceList signature blocks', () => {
  beforeEach(() => {
    mockedUseInvoiceCurrency.mockReturnValue('UAH')
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: { companyName: undefined, domain: undefined },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })
  })

  it('captions one signature line per party at the bottom', () => {
    render(<PriceList data={buildPayment() as any} />)

    expect(screen.getAllByText('(підпис)')).toHaveLength(2)
  })

  it('captions the signature lines in English when currency is not UAH', () => {
    mockedUseInvoiceCurrency.mockReturnValue('USD')
    render(<PriceList data={buildPayment({ currency: 'USD' }) as any} />)

    expect(screen.getAllByText('(signature)')).toHaveLength(2)
    expect(screen.queryByText('(підпис)')).not.toBeInTheDocument()
  })

  it('draws a solid rule to sign on for each party', () => {
    const { container } = render(<PriceList data={buildPayment() as any} />)

    expect(container.querySelectorAll('.signatureLine')).toHaveLength(2)
    // Drawn with a border, not underscore glyphs, which show gaps when printed.
    expect(container.textContent).not.toContain('___')
  })

  it('names each party once, from the description, without a separate heading', () => {
    const { container } = render(<PriceList data={buildPayment() as any} />)

    const [providerBlock, customerBlock] =
      container.querySelectorAll('.signatureBlock')

    expect(
      (
        providerBlock.textContent?.match(
          /Український центр дуальної освіти/g
        ) || []
      ).length
    ).toBe(1)
    expect(
      (customerBlock.textContent?.match(/Футбольний клуб «Полісся»/g) || [])
        .length
    ).toBe(1)
  })

  it('does not repeat the invoice date inside the signature blocks', () => {
    const { container } = render(<PriceList data={buildPayment() as any} />)

    const blocks = container.querySelectorAll('.signatureBlock')
    expect(blocks).toHaveLength(2)
    blocks.forEach((block) => {
      expect(block.textContent).not.toMatch(/\d{1,2}[./]\d{1,2}[./]\d{4}/)
    })
  })

  it('keeps the approval header free of duplicate signature lines', () => {
    const { container } = render(<PriceList data={buildPayment() as any} />)

    // Guard against the assertion below passing vacuously if the class is
    // renamed: the header must exist, and only the two bottom signature blocks
    // may carry a rule to sign on — the ЗАТВЕРДЖУЮ header used to repeat them.
    const approvalHeader = container.querySelector('.approvalSectionWrapper')
    expect(approvalHeader).not.toBeNull()
    expect(approvalHeader?.querySelectorAll('hr')).toHaveLength(0)
  })
})

describe('PriceList service month', () => {
  beforeEach(() => {
    mockedUseInvoiceCurrency.mockReturnValue('UAH')
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: { companyName: undefined, domain: undefined },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })
  })

  it('shows the picked service month in Ukrainian', () => {
    const data = buildPayment({
      monthService: { date: '2026-07-15' },
    })

    render(<PriceList data={data as any} />)

    expect(screen.getByText(/Послуги надані за/)).toHaveTextContent(
      'Послуги надані за липень 2026'
    )
  })

  it('falls back to the invoice date when no service month is picked', () => {
    render(<PriceList data={buildPayment() as any} />)

    expect(screen.getByText(/Послуги надані за/)).toHaveTextContent(
      'Послуги надані за січень 2026'
    )
  })

  it('renders the service month in English when currency is not UAH', () => {
    mockedUseInvoiceCurrency.mockReturnValue('USD')
    const data = buildPayment({
      currency: 'USD',
      monthService: { date: '2026-07-15' },
    })

    render(<PriceList data={data as any} />)

    expect(screen.getByText(/Services rendered for/)).toHaveTextContent(
      'Services rendered for July 2026'
    )
  })
})

describe('PriceList contract reference', () => {
  beforeEach(() => {
    mockedUseInvoiceCurrency.mockReturnValue('UAH')
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: { companyName: undefined, domain: undefined },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })
  })

  it('renders the contract number from the payment snapshot', () => {
    const data = buildPayment()
    data.reciever = { ...data.reciever, contractNumber: '15' } as any

    render(<PriceList data={data as any} />)

    expect(getIntroParagraph().textContent).toContain(
      'відповідно до Договору № 15 Виконавцем надано, а Замовником прийнято такі послуги:'
    )
  })

  it('falls back to the company contract number for an unsaved act', () => {
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: {
        companyName: undefined,
        domain: undefined,
        contractNumber: '7',
      },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })

    render(<PriceList data={buildPayment() as any} />)

    expect(getIntroParagraph().textContent).toContain('Договору № 7')
  })

  it('prefers the payment snapshot over the current company value', () => {
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: {
        companyName: undefined,
        domain: undefined,
        contractNumber: 'new-99',
      },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })
    const data = buildPayment()
    data.reciever = { ...data.reciever, contractNumber: 'old-15' } as any

    render(<PriceList data={data as any} />)

    const text = getIntroParagraph().textContent ?? ''
    expect(text).toContain('Договору № old-15')
    expect(text).not.toContain('new-99')
  })

  it('does not print a number when no contract is set anywhere', () => {
    render(<PriceList data={buildPayment() as any} />)

    const text = getIntroParagraph().textContent ?? ''
    expect(text).toContain('відповідно до Договору Виконавцем надано')
    expect(text).not.toContain('№ ')
  })

  it('renders the contract number together with its date', () => {
    const data = buildPayment()
    data.reciever = {
      ...data.reciever,
      contractNumber: '15',
      contractDate: '2026-03-01',
    } as any

    render(<PriceList data={data as any} />)

    expect(getIntroParagraph().textContent).toContain(
      'відповідно до Договору № 15 від 01.03.2026 Виконавцем надано'
    )
  })

  it('falls back to the company contract date for an unsaved act', () => {
    mockedUsePaymentContext.mockReturnValue({
      form: { getFieldValue: jest.fn() },
      company: {
        companyName: undefined,
        domain: undefined,
        contractNumber: '7',
        contractDate: '2026-03-01',
      },
      showQuantityInPreview: false,
      setShowQuantityInPreview: jest.fn(),
    })

    render(<PriceList data={buildPayment() as any} />)

    expect(getIntroParagraph().textContent).toContain(
      'Договору № 7 від 01.03.2026'
    )
  })

  it('strips a leading № so it is not rendered twice', () => {
    const data = buildPayment()
    data.reciever = { ...data.reciever, contractNumber: '№ 15' } as any

    render(<PriceList data={data as any} />)

    const text = getIntroParagraph().textContent ?? ''
    expect(text).toContain('Договору № 15')
    expect(text).not.toContain('№ № 15')
  })

  it('renders the English contract reference when currency is not UAH', () => {
    mockedUseInvoiceCurrency.mockReturnValue('USD')
    const data = buildPayment({ currency: 'USD' })
    data.reciever = { ...data.reciever, contractNumber: '15' } as any

    render(<PriceList data={data as any} />)

    expect(getIntroParagraph().textContent).toContain(
      'in accordance with the Agreement No. 15, the Provider has provided'
    )
  })
})
