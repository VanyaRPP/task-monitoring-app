import React from 'react'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { ServiceType } from '@utils/constants'
import i18n from '@common/lib/i18n'
import GroupedPricesTable, {
  shouldShowInvoiceQuantityAndPriceColumns,
  shouldUseGroupedByDomainPreviewLayout,
} from './index'

const mockUsePaymentContext = jest.fn()

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => mockUsePaymentContext(),
}))

const mockUseGetCustomServicesByDomainQuery = jest.fn()

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: (...args: unknown[]) =>
    mockUseGetCustomServicesByDomainQuery(...args),
}))
;(global as any).ResizeObserver = class {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

describe('preview quantity checkbox / detail columns flags', () => {
  test('shows qty & price columns when details checkbox is on', () => {
    expect(shouldShowInvoiceQuantityAndPriceColumns(true, true, true)).toBe(
      true
    )
  })

  test('hides qty & price in compact preview (toggle on, checkbox off)', () => {
    expect(shouldShowInvoiceQuantityAndPriceColumns(true, true, false)).toBe(
      false
    )
  })

  test('shows qty & price when usePreviewQuantityToggle is off (Акт / без toggle)', () => {
    expect(
      shouldShowInvoiceQuantityAndPriceColumns(true, undefined, false)
    ).toBe(true)
    expect(shouldShowInvoiceQuantityAndPriceColumns(true, false, false)).toBe(
      true
    )
  })

  test('shows qty & price when not preview mode', () => {
    expect(shouldShowInvoiceQuantityAndPriceColumns(false, true, false)).toBe(
      true
    )
  })

  test('grouped layout only in compact preview with domain and groups', () => {
    expect(
      shouldUseGroupedByDomainPreviewLayout(true, true, false, 'd1', 2)
    ).toBe(true)
    expect(
      shouldUseGroupedByDomainPreviewLayout(true, true, true, 'd1', 2)
    ).toBe(false)
    expect(
      shouldUseGroupedByDomainPreviewLayout(true, true, false, undefined, 2)
    ).toBe(false)
    expect(
      shouldUseGroupedByDomainPreviewLayout(true, true, false, 'd1', 0)
    ).toBe(false)
    expect(
      shouldUseGroupedByDomainPreviewLayout(true, undefined, false, 'd1', 2)
    ).toBe(false)
  })
})

describe('GroupedPricesTable', () => {
  const baseInvoice = {
    type: ServiceType.Maintenance,
    sum: 500,
    amount: 50,
    price: 10,
  }

  beforeEach(() => {
    mockUsePaymentContext.mockReturnValue({
      form: {
        getFieldsValue: () => ({ domain: { currency: 'UAH' } }),
      },
      company: { currency: 'UAH' },
      showQuantityInPreview: false,
    })
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    })
  })

  const renderTable = (
    props: Partial<React.ComponentProps<typeof GroupedPricesTable>> = {}
  ) =>
    render(
      <I18nextProvider i18n={i18n}>
        <GroupedPricesTable
          preview
          currency="UAH"
          invoices={[baseInvoice]}
          domainId="domain-1"
          {...props}
        />
      </I18nextProvider>
    )

  test('compact preview: 3 columns without quantity (toggle on, checkbox off, no groups)', () => {
    renderTable({ usePreviewQuantityToggle: true })

    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBe(3)
    expect(
      screen.queryByRole('columnheader', { name: /К-сть/i })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Утримання')).toBeInTheDocument()
  })

  test('details on: 5 columns including quantity', () => {
    mockUsePaymentContext.mockReturnValue({
      form: {
        getFieldsValue: () => ({ domain: { currency: 'UAH' } }),
      },
      company: { currency: 'UAH' },
      showQuantityInPreview: true,
    })

    renderTable({ usePreviewQuantityToggle: true })

    expect(screen.getAllByRole('columnheader').length).toBe(5)
    expect(
      screen.getByRole('columnheader', { name: /К-сть/i })
    ).toBeInTheDocument()
  })

  test('without usePreviewQuantityToggle: full columns even if checkbox off in context', () => {
    mockUsePaymentContext.mockReturnValue({
      form: {
        getFieldsValue: () => ({ domain: { currency: 'UAH' } }),
      },
      company: { currency: 'UAH' },
      showQuantityInPreview: false,
    })

    renderTable({ usePreviewQuantityToggle: undefined })

    expect(screen.getAllByRole('columnheader').length).toBe(5)
  })

  test('grouped preview: shows domain group name instead of line label', () => {
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Група тест',
            services: [
              { name: 'x', fieldName: ServiceType.Maintenance, _id: 's1' },
            ],
          },
        ],
      },
      isLoading: false,
    })

    renderTable({ usePreviewQuantityToggle: true })

    expect(screen.getByText('Група тест')).toBeInTheDocument()
    expect(screen.queryByText('Утримання')).not.toBeInTheDocument()
    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBe(3)
  })
})
