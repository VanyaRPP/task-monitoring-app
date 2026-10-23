import { render, waitFor } from '@testing-library/react'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import GroupedReceiptForm from './index'
import HeadlessReceiptRenderer from './HeadlessReceiptRenderer'

jest.mock('./style.module.scss', () => ({}))
jest.mock('./templates/style.module.scss', () => ({}))

let mockTemplate = 'classic'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    template: mockTemplate,
    setTemplate: jest.fn(),
    company: { currency: 'UAH' },
    showQuantityInPreview: false,
    setShowQuantityInPreview: jest.fn(),
  }),
}))
;(global as any).ResizeObserver = class {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

jest.mock('@components/Forms/GroupedReceiptForm/GroupedPricesTable', () => ({
  __esModule: true,
  default: () => <div>GroupedPricesTable</div>,
}))

jest.mock('@common/api/paymentApi/payment.api', () => ({
  useEditPaymentMutation: () => [jest.fn().mockResolvedValue({ data: {} })],
  useSendPaymentEmailMutation: () => [
    jest.fn().mockResolvedValue({ success: true }),
  ],
  useUpdatePaymentStatusMutation: () => [
    jest.fn().mockResolvedValue({ data: {} }),
  ],
}))

jest.mock('@common/api/invoiceTemplateApi/invoiceTemplate.api', () => ({
  useGetInvoiceTemplatesQuery: () => ({ data: { data: [] } }),
  useCreateInvoiceTemplateMutation: () => [jest.fn()],
  useUpdateInvoiceTemplateMutation: () => [jest.fn()],
}))

jest.mock('next/dynamic', () => (importFn: () => Promise<any>) => {
  let Component: any = null
  importFn().then((mod: any) => {
    Component = mod.default
  })
  const DynamicComponent = (props: any) => {
    if (!Component) return null
    return require('react').createElement(Component, props)
  }
  return DynamicComponent
})

const TEMPLATES = ['classic', 'olimp', 'ledger', 'official']
// 'official' prints only the receiver company name, never its description.
const DESCRIPTION_TEMPLATES = ['classic', 'olimp', 'ledger']

const DESCRIPTION_LINES = [
  'ТОВ «Акме»',
  'ЄДРПОУ 12345678',
  'м. Київ, вул. Хрещатик, 1',
]
const DESCRIPTION = DESCRIPTION_LINES.join('\n')

const ADMIN_EMAIL = 'owner@acme.ua'
const OTHER_ADMIN_EMAILS = ['buh@acme.ua', 'director@acme.ua']

const makeCompany = (overrides: Record<string, unknown> = {}) => ({
  _id: 'company-1',
  companyName: 'Акме',
  description: DESCRIPTION,
  adminEmails: [ADMIN_EMAIL],
  domain: { _id: 'domain-1', name: 'Домен', description: 'Постачальник' },
  ...overrides,
})

const makePayment = (company: ReturnType<typeof makeCompany>) => {
  const { provider, reciever } = getPaymentProviderAndReciever(company)
  return {
    _id: 'payment-1',
    type: 'debit',
    template: mockTemplate,
    invoiceNumber: 42,
    invoiceCreationDate: '2026-01-15',
    currency: 'UAH',
    domain: company.domain,
    provider,
    reciever,
    invoice: [{ name: 'Оренда', price: 100, amount: 1, sum: 100 }],
    generalSum: 100,
  }
}

const renderPreview = (payment: unknown) => {
  const { container, unmount } = render(
    <GroupedReceiptForm
      paymentData={payment as any}
      paymentActions={{ preview: true, edit: false }}
    />
  )
  const text = container.textContent ?? ''
  unmount()
  return text
}

const renderPdfHtml = async (payment: any) => {
  const onCapture = jest.fn()
  const { unmount } = render(
    <HeadlessReceiptRenderer
      payment={payment}
      templateKey={payment.template}
      captureDelayMs={0}
      onCapture={onCapture}
    />
  )
  await waitFor(() => expect(onCapture).toHaveBeenCalled())
  unmount()
  return onCapture.mock.calls[0][0] as string
}

const textOf = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}

const allAdminEmails = [ADMIN_EMAIL, ...OTHER_ADMIN_EMAILS]

const receiverFacts = (text: string) => ({
  descriptionLines: DESCRIPTION_LINES.filter((l) => text.includes(l)),
  adminEmails: allAdminEmails.filter((e) => text.includes(e)),
})

describe.each(TEMPLATES)('Recipient in the "%s" template', (templateKey) => {
  beforeEach(() => {
    mockTemplate = templateKey
  })

  it('Company with one administrator: Email is not included in the account', async () => {
    const payment = makePayment(makeCompany({ adminEmails: [ADMIN_EMAIL] }))

    expect(payment.reciever).not.toHaveProperty('adminEmails')
    expect(renderPreview(payment)).not.toContain(ADMIN_EMAIL)
    expect(textOf(await renderPdfHtml(payment))).not.toContain(ADMIN_EMAIL)
  })

  it('A company with multiple administrators: no emails are delivered to the account', async () => {
    const payment = makePayment(makeCompany({ adminEmails: allAdminEmails }))
    const preview = renderPreview(payment)
    const pdf = textOf(await renderPdfHtml(payment))

    expect(payment.reciever).not.toHaveProperty('adminEmails')
    allAdminEmails.forEach((email) => {
      expect(preview).not.toContain(email)
      expect(pdf).not.toContain(email)
    })
  })

  it('Company without administrators: The invoice is generated correctly', async () => {
    const payment = makePayment(makeCompany({ adminEmails: [] }))
    const preview = renderPreview(payment)
    const pdf = textOf(await renderPdfHtml(payment))

    expect(payment.reciever).toEqual({
      companyName: 'Акме',
      description: DESCRIPTION,
      contractNumber: undefined,
      contractDate: undefined,
    })
    for (const text of [preview, pdf]) {
      expect(text).toContain('Акме')
      expect(text).toContain('100.00')
    }
  })

  it("A change in the company's administrators does not change the account information", async () => {
    const before = makePayment(makeCompany({ adminEmails: [ADMIN_EMAIL] }))
    const after = makePayment(makeCompany({ adminEmails: OTHER_ADMIN_EMAILS }))

    expect(after.reciever).toEqual(before.reciever)
    expect(renderPreview(after)).toBe(renderPreview(before))
    expect(await renderPdfHtml(after)).toBe(await renderPdfHtml(before))
  })

  it('The preview and the PDF contain the same recipient information', async () => {
    const payment = makePayment(makeCompany({ adminEmails: allAdminEmails }))
    const preview = renderPreview(payment)
    const pdf = textOf(await renderPdfHtml(payment))

    expect(receiverFacts(pdf)).toEqual(receiverFacts(preview))
    expect(receiverFacts(pdf).adminEmails).toEqual([])
  })
})

describe.each(DESCRIPTION_TEMPLATES)(
  'Company description in the "%s" template',
  (templateKey) => {
    beforeEach(() => {
      mockTemplate = templateKey
    })

    it('A company without administrators: the recipient is selected from the list', async () => {
      const payment = makePayment(makeCompany({ adminEmails: [] }))
      const preview = renderPreview(payment)
      const pdf = textOf(await renderPdfHtml(payment))

      DESCRIPTION_LINES.forEach((line) => {
        expect(preview).toContain(line)
        expect(pdf).toContain(line)
      })
    })

    it('The updated company description appears on the new invoice', async () => {
      const oldPayment = makePayment(makeCompany())
      expect(renderPreview(oldPayment)).toContain('ЄДРПОУ 12345678')

      const newPayment = makePayment(
        makeCompany({
          description: 'ТОВ «Акме Нова»\nЄДРПОУ 87654321\nм. Львів',
        })
      )
      const preview = renderPreview(newPayment)
      const pdf = textOf(await renderPdfHtml(newPayment))

      for (const text of [preview, pdf]) {
        expect(text).toContain('ЄДРПОУ 87654321')
        expect(text).toContain('м. Львів')
        expect(text).not.toContain('ЄДРПОУ 12345678')
      }
    })

    it('An email address entered manually in the description appears as plain text', async () => {
      const payment = makePayment(
        makeCompany({
          description: `${DESCRIPTION}\nE-mail: invoices@acme.ua`,
          adminEmails: [ADMIN_EMAIL],
        })
      )
      const preview = renderPreview(payment)
      const pdf = textOf(await renderPdfHtml(payment))

      for (const text of [preview, pdf]) {
        expect(text).toContain('E-mail: invoices@acme.ua')
        expect(text).not.toContain(ADMIN_EMAIL)
      }
    })

    it('The preview and PDF show the full description and no administrator email address', async () => {
      const payment = makePayment(makeCompany({ adminEmails: allAdminEmails }))
      const expected = { descriptionLines: DESCRIPTION_LINES, adminEmails: [] }

      expect(receiverFacts(renderPreview(payment))).toEqual(expected)
      expect(receiverFacts(textOf(await renderPdfHtml(payment)))).toEqual(
        expected
      )
    })
  }
)

describe('Recipient: Preserving line breaks', () => {
  beforeEach(() => {
    mockTemplate = 'classic'
  })

  it('The classic template outputs the description in <pre> with line breaks', async () => {
    const payment = makePayment(makeCompany())
    const doc = new DOMParser().parseFromString(
      await renderPdfHtml(payment),
      'text/html'
    )
    const receiverPre = Array.from(doc.querySelectorAll('pre')).find((pre) =>
      pre.textContent?.includes(DESCRIPTION_LINES[0])
    )

    expect(receiverPre?.textContent?.trim()).toBe(DESCRIPTION)
  })
})

describe('Recipient: Old payments from adminEmails in the database', () => {
  it.each(TEMPLATES)(
    'The "%s" template does not display saved adminEmails',
    async (templateKey) => {
      mockTemplate = templateKey
      const legacy = makePayment(makeCompany())
      const payment = {
        ...legacy,
        reciever: { ...legacy.reciever, adminEmails: allAdminEmails },
      }
      const preview = renderPreview(payment)
      const pdf = textOf(await renderPdfHtml(payment))

      allAdminEmails.forEach((email) => {
        expect(preview).not.toContain(email)
        expect(pdf).not.toContain(email)
      })
    }
  )
})
