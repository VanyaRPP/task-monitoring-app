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

  test('grouped preview: custom service rolled up under group header', () => {
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Група тест',
            services: [{ name: 'Custom A', fieldName: 'customA', _id: 's1' }],
          },
        ],
      },
      isLoading: false,
    })

    const customInvoice = {
      type: 'custom',
      customService: true,
      fieldName: 'customA',
      name: 'Custom A',
      sum: 250,
    }

    renderTable({
      usePreviewQuantityToggle: true,
      invoices: [customInvoice],
    })

    expect(screen.getByText('Група тест')).toBeInTheDocument()
    // Individual custom name is replaced by the group header label.
    expect(screen.queryByText('Custom A')).not.toBeInTheDocument()
    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBe(3)
  })

  test('grouped preview: multiple custom services in one group roll up to a single row with summed total', () => {
    // Three custom services in the same group → ONE row in the invoice with
    // the group name and sum-of-all. Individual service names must NOT appear.
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Комунальні',
            services: [
              { name: 'A', fieldName: 'a', _id: 's1' },
              { name: 'B', fieldName: 'b', _id: 's2' },
              { name: 'C', fieldName: 'c', _id: 's3' },
            ],
          },
        ],
      },
      isLoading: false,
    })

    const customInvoices = [
      {
        type: 'custom',
        customService: true,
        fieldName: 'a',
        name: 'A',
        sum: 100,
      },
      {
        type: 'custom',
        customService: true,
        fieldName: 'b',
        name: 'B',
        sum: 200,
      },
      {
        type: 'custom',
        customService: true,
        fieldName: 'c',
        name: 'C',
        sum: 50,
      },
    ]

    renderTable({
      usePreviewQuantityToggle: true,
      invoices: customInvoices,
    })

    expect(screen.getByText('Комунальні')).toBeInTheDocument()
    expect(screen.getByText('350.00')).toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
    expect(screen.queryByText('B')).not.toBeInTheDocument()
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })

  test('grouped preview: two distinct groups produce two distinct rows', () => {
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Група X',
            services: [{ name: 'X1', fieldName: 'x1', _id: 'sx1' }],
          },
          {
            groupName: 'Група Y',
            services: [
              { name: 'Y1', fieldName: 'y1', _id: 'sy1' },
              { name: 'Y2', fieldName: 'y2', _id: 'sy2' },
            ],
          },
        ],
      },
      isLoading: false,
    })

    renderTable({
      usePreviewQuantityToggle: true,
      invoices: [
        {
          type: 'custom',
          customService: true,
          fieldName: 'x1',
          name: 'X1',
          sum: 60,
        },
        {
          type: 'custom',
          customService: true,
          fieldName: 'y1',
          name: 'Y1',
          sum: 40,
        },
        {
          type: 'custom',
          customService: true,
          fieldName: 'y2',
          name: 'Y2',
          sum: 10,
        },
      ],
    })

    expect(screen.getByText('Група X')).toBeInTheDocument()
    expect(screen.getByText('Група Y')).toBeInTheDocument()
    expect(screen.getByText('60.00')).toBeInTheDocument()
    expect(screen.getByText('50.00')).toBeInTheDocument()
  })

  test('grouped preview: mixed standard + grouped custom + ungrouped + multiple-group renders correctly', () => {
    // Combined scenario covering the full intent:
    //   - one user-defined group with two services → one rolled-up row
    //   - one ungrouped service → standalone row
    //   - one standard service (Maintenance) → standalone row
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Комунальні',
            services: [
              { name: 'Газ', fieldName: 'gaz', _id: 'g1' },
              { name: 'Опалення', fieldName: 'heat', _id: 'h1' },
            ],
          },
          {
            groupName: null,
            services: [{ name: 'Окрема', fieldName: 'lone', _id: 'l1' }],
          },
        ],
      },
      isLoading: false,
    })

    renderTable({
      usePreviewQuantityToggle: true,
      invoices: [
        // standard
        { type: ServiceType.Maintenance, sum: 500, amount: 50, price: 10 },
        // two grouped custom
        {
          type: 'custom',
          customService: true,
          fieldName: 'gaz',
          name: 'Газ',
          sum: 120,
        },
        {
          type: 'custom',
          customService: true,
          fieldName: 'heat',
          name: 'Опалення',
          sum: 80,
        },
        // ungrouped custom
        {
          type: 'custom',
          customService: true,
          fieldName: 'lone',
          name: 'Окрема',
          sum: 30,
        },
      ],
    })

    // Group header with summed total replaces individual names.
    expect(screen.getByText('Комунальні')).toBeInTheDocument()
    expect(screen.getByText('200.00')).toBeInTheDocument()
    expect(screen.queryByText('Газ')).not.toBeInTheDocument()
    expect(screen.queryByText('Опалення')).not.toBeInTheDocument()

    // Standalone rows for standard and ungrouped.
    expect(screen.getByText('Утримання')).toBeInTheDocument()
    expect(screen.getByText('Окрема')).toBeInTheDocument()

    // No null header.
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  test('grouped preview: ungrouped custom services render as standalone rows', () => {
    // Backend marks the "no group" bucket with groupName: null. Invoice render
    // must NOT collapse those entries under a "null" header — they render as
    // individual line items, by their own name.
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: null,
            services: [{ name: 'Loose A', fieldName: 'looseA', _id: 'u1' }],
          },
        ],
      },
      isLoading: false,
    })

    const ungroupedInvoice = {
      type: 'custom',
      customService: true,
      fieldName: 'looseA',
      name: 'Loose A',
      sum: 75,
    }

    renderTable({
      usePreviewQuantityToggle: true,
      invoices: [ungroupedInvoice],
    })

    expect(screen.getByText('Loose A')).toBeInTheDocument()
    // No "null" header smuggled into the table.
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  test('grouped preview: standard service inside a user-defined group is rolled up under that group', () => {
    // Maintenance (standard) is technically a CustomService doc with
    // fieldName='maintenancePrice'. When a domain admin puts it on the RIGHT
    // of a user-defined group's Transfer, the invoice rendering MUST show the
    // group header — not the standalone "Утримання" label. Same rule as for
    // truly custom services.
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

  test('grouped preview: standard service that is NOT in any group renders standalone', () => {
    // Same Maintenance invoice, but the domain has no groups containing it
    // (only an unrelated group with a different service). The Maintenance row
    // must render with its own label, NOT under "Інше" group.
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Інше',
            services: [{ name: 'Y', fieldName: 'yyy', _id: 'sy' }],
          },
        ],
      },
      isLoading: false,
    })

    renderTable({ usePreviewQuantityToggle: true })

    expect(screen.getByText('Утримання')).toBeInTheDocument()
    expect(screen.queryByText('Інше')).not.toBeInTheDocument()
  })

  // ── description-aware label resolution (commit 3e9533fe) ──
  describe('resolveInvoiceLabel priority', () => {
    test('uses description when present (highest priority)', () => {
      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [
          { ...baseInvoice, name: 'Service name', description: 'Custom desc' },
        ],
      })
      expect(screen.getByText('Custom desc')).toBeInTheDocument()
      expect(screen.queryByText('Service name')).not.toBeInTheDocument()
      expect(screen.queryByText('Утримання')).not.toBeInTheDocument()
    })

    test('falls back to name when description is missing', () => {
      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [{ ...baseInvoice, name: 'Custom name' }],
      })
      expect(screen.getByText('Custom name')).toBeInTheDocument()
      expect(screen.queryByText('Утримання')).not.toBeInTheDocument()
    })

    test('falls back to t(services.<type>) when neither description nor name present', () => {
      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [{ ...baseInvoice, name: undefined, description: undefined }],
      })
      expect(screen.getByText('Утримання')).toBeInTheDocument()
    })
  })

  describe('discount row label', () => {
    test('uses discount.description when present (not the translation key)', () => {
      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [
          baseInvoice,
          {
            type: 'discount',
            sum: -100,
            description: 'Знижка постійного клієнта',
          },
        ],
      })
      expect(screen.getByText('Знижка постійного клієнта')).toBeInTheDocument()
      // The legacy hard-coded "Знижка" (services.discount) must NOT appear
      // for this row, only the user-provided description.
      expect(screen.queryByText('Знижка')).not.toBeInTheDocument()
    })

    test('uses discount.name when no description', () => {
      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [
          baseInvoice,
          { type: 'discount', sum: -100, name: 'Спец-знижка' },
        ],
      })
      expect(screen.getByText('Спец-знижка')).toBeInTheDocument()
    })

    test('falls back to services.discount translation when name/description missing', () => {
      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [baseInvoice, { type: 'discount', sum: -100 }],
      })
      expect(screen.getByText('Знижка')).toBeInTheDocument()
    })

    test('description resolution works inside grouped-by-domain layout for unmatched rows', () => {
      mockUseGetCustomServicesByDomainQuery.mockReturnValue({
        data: {
          data: [
            {
              groupName: 'Група тест',
              services: [{ name: 'A', fieldName: 'customA', _id: 's1' }],
            },
          ],
        },
        isLoading: false,
      })

      const customMatched = {
        type: 'custom',
        customService: true,
        fieldName: 'customA',
        name: 'Custom A',
        sum: 250,
      }

      renderTable({
        usePreviewQuantityToggle: true,
        invoices: [
          customMatched, // matches the group → header row
          {
            type: 'unmatched',
            sum: 50,
            name: 'raw name',
            description: 'pretty desc',
          },
        ],
      })

      expect(screen.getByText('Група тест')).toBeInTheDocument()
      // Unmatched row should render through resolveInvoiceLabel and prefer
      // description over name.
      expect(screen.getByText('pretty desc')).toBeInTheDocument()
      expect(screen.queryByText('raw name')).not.toBeInTheDocument()
    })
  })
})
