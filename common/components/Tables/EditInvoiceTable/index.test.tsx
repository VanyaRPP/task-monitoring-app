import '@testing-library/jest-dom'
import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import { ServiceType } from '@utils/constants'

// Stub each invoice subdirectory with a minimal { Name, Amount, Price, Sum }
// quartet that just renders an identifying string. This lets us assert that
// the dispatcher routes record.type → correct subcomponent without rendering
// the heavy real components.
const makeStub = (label: string) => {
  const Stub = ({ name }: { name: number }) => (
    <span>{`${label}-${name ?? '?'}`}</span>
  )
  return { Name: Stub, Amount: Stub, Price: Stub, Sum: Stub }
}

jest.mock('./Maintenance', () => makeStub('M'))
jest.mock('./Placing', () => makeStub('P'))
jest.mock('./Inflicion', () => makeStub('I'))
jest.mock('./GarbageCollector', () => makeStub('G'))
jest.mock('./Electricity', () => makeStub('E'))
jest.mock('./Water', () => makeStub('W'))
jest.mock('./WaterPart', () => makeStub('WP'))
jest.mock('./Cleaning', () => makeStub('CL'))
jest.mock('./Discount', () => makeStub('D'))
jest.mock('./Custom', () => makeStub('CUSTOM'))

// Catalog query is mocked through a jest.fn() so individual tests can both
// inspect the arguments (to verify domainId resolution) and stub the response.
const mockUseGetCustomServicesByDomainQuery = jest.fn()
jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: (...args: any[]) =>
    mockUseGetCustomServicesByDomainQuery(...args),
}))

import { EditInvoicesTable_unstable, InvoiceSelector } from './index'
import { Form } from 'antd'

beforeEach(() => {
  mockUseGetCustomServicesByDomainQuery.mockReset()
  mockUseGetCustomServicesByDomainQuery.mockReturnValue({
    data: { data: [] },
    isLoading: false,
  })
})

const NO_DOMAIN_PLACEHOLDER = 'Немає домену в сервісі — каталог недоступний'
const HAS_DOMAIN_PLACEHOLDER = 'Додати поле з каталогу домену...'

const renderTable = (invoice: any[]) => {
  const Wrapper = () => {
    const [form] = Form.useForm()
    return (
      <Form form={form} initialValues={{ invoice }}>
        <EditInvoicesTable_unstable form={form} editable />
      </Form>
    )
  }
  return render(<Wrapper />)
}

describe('Component dispatcher', () => {
  it.each([
    [ServiceType.Maintenance, 'M-0'],
    [ServiceType.Placing, 'P-0'],
    [ServiceType.Inflicion, 'I-0'],
    [ServiceType.GarbageCollector, 'G-0'],
    [ServiceType.Electricity, 'E-0'],
    [ServiceType.Water, 'W-0'],
    [ServiceType.WaterPart, 'WP-0'],
    [ServiceType.Cleaning, 'CL-0'],
    [ServiceType.Discount, 'D-0'],
    [ServiceType.Custom, 'CUSTOM-0'],
  ])('routes ServiceType.%s to its component module', (type, expected) => {
    renderTable([{ type }])
    // Each cell (Name/Amount/Price/Sum) renders the stub once → 4 instances.
    expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
  })

  it('falls back to Custom for an unknown record.type', () => {
    renderTable([{ type: 'unknown-future-type' as any }])
    expect(screen.getAllByText('CUSTOM-0').length).toBeGreaterThan(0)
  })
})

describe('<InvoiceSelector> domainId resolution', () => {
  // Scenario: жодної з прив'язок немає — показуємо "немає домену"
  it('shows "no domain" placeholder and skips catalog fetch when nothing is provided', () => {
    render(<InvoiceSelector service={undefined} excludeKeys={[]} />)

    expect(screen.queryByText(NO_DOMAIN_PLACEHOLDER)).not.toBeNull()
    expect(screen.queryByText(HAS_DOMAIN_PLACEHOLDER)).toBeNull()
    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: undefined },
      { skip: true }
    )
  })

  // Scenario: сервіс є за цей місяць (звичайний шлях) — беремо domain із сервісу
  it('uses service.domain._id when the service has a domain', () => {
    render(
      <InvoiceSelector
        service={{ domain: { _id: 'svc-domain' } } as any}
        excludeKeys={[]}
      />
    )

    expect(screen.queryByText(HAS_DOMAIN_PLACEHOLDER)).not.toBeNull()
    expect(screen.queryByText(NO_DOMAIN_PLACEHOLDER)).toBeNull()
    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: ['svc-domain'] },
      { skip: false }
    )
  })

  // Scenario: послуг взагалі не створено за цей місяць (placeholder-режим) —
  // фолбек на domainId-проп, який приходить із форми
  it('falls back to domainId prop when service is missing (placeholder-month case)', () => {
    render(<InvoiceSelector domainId="fallback-domain" excludeKeys={[]} />)

    expect(screen.queryByText(HAS_DOMAIN_PLACEHOLDER)).not.toBeNull()
    expect(screen.queryByText(NO_DOMAIN_PLACEHOLDER)).toBeNull()
    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: ['fallback-domain'] },
      { skip: false }
    )
  })

  // Scenario: сервіс є, але без domain — теж фолбек на проп
  it('falls back to domainId prop when service exists but has no domain', () => {
    render(
      <InvoiceSelector
        service={{} as any}
        domainId="fallback-domain"
        excludeKeys={[]}
      />
    )

    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: ['fallback-domain'] },
      { skip: false }
    )
  })

  // Service-domain має пріоритет: коли реальний сервіс прив'язаний — на проп
  // взагалі не дивимось (захист від расинхрону між service і form.domain)
  it('prefers service.domain._id over the domainId prop when both are present', () => {
    render(
      <InvoiceSelector
        service={{ domain: { _id: 'svc-domain' } } as any}
        domainId="fallback-domain"
        excludeKeys={[]}
      />
    )

    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: ['svc-domain'] },
      { skip: false }
    )
  })

  it('treats empty-string domainId as "no domain"', () => {
    render(<InvoiceSelector domainId="" excludeKeys={[]} />)

    expect(screen.queryByText(NO_DOMAIN_PLACEHOLDER)).not.toBeNull()
    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: undefined },
      { skip: true }
    )
  })
})

describe('<InvoiceSelector> price-context wiring (catalog → payload)', () => {
  // Catalog returns one Custom-type row. The user clicks it; the payload
  // emitted to onSelect should carry the resolved price.
  const setCatalogToInternetRow = () => {
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Інтернет-послуги',
            services: [
              {
                _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
                name: 'Інтернет',
                fieldName: 'internetPrice',
              },
            ],
          },
        ],
      },
      isLoading: false,
    })
  }

  const clickInternetOption = () => {
    // antd Select opens on mouseDown of its combobox role element.
    const selectInput = screen.getByRole('combobox')
    fireEvent.mouseDown(selectInput)
    // The option text is the catalog row's name.
    const option = screen.getByText('Інтернет')
    fireEvent.click(option)
  }

  it('emits price: 0 when no context is provided (backward compat)', () => {
    setCatalogToInternetRow()
    const onSelect = jest.fn()

    render(
      <InvoiceSelector domainId="d-1" excludeKeys={[]} onSelect={onSelect} />
    )
    clickInternetOption()

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ServiceType.Custom,
        fieldName: 'internetPrice',
        price: 0,
        sum: 0,
      })
    )
  })

  // NEW: the prev-payment fallback feature
  it('emits the prev-payment price when service & company have no override', () => {
    setCatalogToInternetRow()
    const onSelect = jest.fn()

    render(
      <InvoiceSelector
        domainId="d-1"
        excludeKeys={[]}
        onSelect={onSelect}
        prevPayment={
          {
            invoice: [
              {
                type: ServiceType.Custom,
                name: 'Інтернет',
                fieldName: 'internetPrice',
                price: 250,
                sum: 250,
              },
            ],
          } as any
        }
      />
    )
    clickInternetOption()

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ServiceType.Custom,
        fieldName: 'internetPrice',
        price: 250,
        sum: 250,
      })
    )
  })

  it('emits the company price even when prev-payment also matches (company wins)', () => {
    setCatalogToInternetRow()
    const onSelect = jest.fn()

    render(
      <InvoiceSelector
        domainId="d-1"
        excludeKeys={[]}
        onSelect={onSelect}
        company={
          {
            customServices: [
              {
                _id: 'cc',
                label: 'Інтернет',
                fieldName: 'internetPrice',
                price: 333,
              },
            ],
          } as any
        }
        prevPayment={
          {
            invoice: [
              {
                type: ServiceType.Custom,
                fieldName: 'internetPrice',
                price: 100,
                sum: 100,
              },
            ],
          } as any
        }
      />
    )
    clickInternetOption()

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ServiceType.Custom,
        fieldName: 'internetPrice',
        price: 333,
        sum: 333,
      })
    )
  })
})

describe('<InvoiceSelector> typed-line ServiceType exclusion', () => {
  const setCatalogToMaintenanceRow = () => {
    mockUseGetCustomServicesByDomainQuery.mockReturnValue({
      data: {
        data: [
          {
            groupName: 'Комунальні',
            services: [
              {
                _id: '677d414283b6ef93c6b8ea2c',
                name: 'Утримання',
                fieldName: 'rentPrice',
              },
            ],
          },
        ],
      },
      isLoading: false,
    })
  }

  it('hides a utility option already represented by a typed invoice line', () => {
    setCatalogToMaintenanceRow()

    render(
      <InvoiceSelector
        domainId="d-1"
        excludeKeys={['stype:maintenancePrice']}
        excludeServiceTypes={new Set([ServiceType.Maintenance])}
      />
    )

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.queryByText('Утримання')).toBeNull()
  })

  it('shows the utility option when no line owns its ServiceType', () => {
    setCatalogToMaintenanceRow()

    render(
      <InvoiceSelector
        domainId="d-1"
        excludeKeys={[]}
        excludeServiceTypes={new Set([ServiceType.Electricity])}
      />
    )

    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.queryByText('Утримання')).not.toBeNull()
  })
})

describe('<EditInvoicesTable_unstable> domainId wiring', () => {
  // Регресія-перевірка: проп domainId на обгортці повинен доходити до
  // InvoiceSelector — інакше placeholder-режим знову зламається
  it('forwards the domainId prop down to the InvoiceSelector', () => {
    const Wrapper = () => {
      const [form] = Form.useForm()
      return (
        <Form form={form} initialValues={{ invoice: [] }}>
          <EditInvoicesTable_unstable
            form={form}
            editable
            domainId="wired-domain"
          />
        </Form>
      )
    }
    render(<Wrapper />)

    expect(mockUseGetCustomServicesByDomainQuery).toHaveBeenCalledWith(
      { domainId: ['wired-domain'] },
      { skip: false }
    )
  })

  it('keeps the selector disabled when neither service nor domainId is passed', () => {
    const Wrapper = () => {
      const [form] = Form.useForm()
      return (
        <Form form={form} initialValues={{ invoice: [] }}>
          <EditInvoicesTable_unstable form={form} editable />
        </Form>
      )
    }
    render(<Wrapper />)

    expect(screen.queryByText(NO_DOMAIN_PLACEHOLDER)).not.toBeNull()
  })
})
