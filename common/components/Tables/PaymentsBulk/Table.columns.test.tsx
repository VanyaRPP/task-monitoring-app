/**
 * Table «Створення рахунків»: Drag & Drop колонок, приховування/відновлення та
 * загальна сума по компанії — на справжній формі й справжніх комірках.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form } from 'antd'
import React from 'react'

const mockBulkContext: { current: any } = { current: {} }
jest.mock('@common/components/DashboardPage/blocks/paymentsBulk', () => ({
  __esModule: true,
  useInvoicesPaymentContext: () => mockBulkContext.current,
}))

const MAINTENANCE = {
  _id: '677d414283b6ef93c6b8ea2c',
  name: 'Утримання приміщень (грн/м²)',
  fieldName: 'rentPrice',
}
const PLACING = {
  _id: '682dd48d9665126611c81950',
  name: 'Розміщення',
  fieldName: 'placingPrice',
}

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({
    data: {
      data: [
        {
          services: [
            {
              _id: '677d414283b6ef93c6b8ea2c',
              name: 'Утримання приміщень (грн/м²)',
              fieldName: 'rentPrice',
            },
            {
              _id: '682dd48d9665126611c81950',
              name: 'Розміщення',
              fieldName: 'placingPrice',
            },
          ],
        },
      ],
    },
  }),
}))
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => ({ data: { _id: 'user-1' } }),
}))
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/x' }) }))
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}))
jest.mock('@modules/hooks/useTheme', () => ({
  __esModule: true,
  default: () => ['dark', jest.fn()],
}))
jest.mock('@modules/hooks/useFloatButton', () => ({
  ...jest.requireActual('@modules/hooks/useFloatButton'),
  useDragDropPanelFloatButton: () => [true, jest.fn(), { key: 'panel' }],
}))

// Перехоплюємо onDragEnd, щоб імітувати перетягування заголовка.
const dnd: { onDragEnd?: (e: any) => void } = {}
jest.mock('@dnd-kit/core', () => {
  const actual = jest.requireActual('@dnd-kit/core')
  return {
    ...actual,
    DndContext: (props: any) => {
      dnd.onDragEnd = props.onDragEnd
      return <actual.DndContext {...props} />
    },
  }
})

// eslint-disable-next-line import/first
import InvoicesTable from './Table'

const service = {
  _id: 'month-1',
  date: new Date('2026-09-01'),
  domain: { _id: 'domain-1' },
  street: { _id: 'street-1' },
  rentPrice: 10,
  electricityPrice: 0,
  waterPrice: 0,
  waterPriceTotal: 0,
  customServices: [
    {
      _id: MAINTENANCE._id,
      label: MAINTENANCE.name,
      fieldName: 'rentPrice',
      price: 10,
    },
    {
      _id: PLACING._id,
      label: PLACING.name,
      fieldName: 'placingPrice',
      price: 40,
    },
  ],
}
const company = (id: string, name: string) => ({
  _id: id,
  companyName: name,
  domain: { _id: 'domain-1' },
  street: { _id: 'street-1' },
  totalArea: 100,
  pricePerMeter: 0,
  inflicion: false,
  customServices: [],
})

let formRef: any
const Harness: React.FC<{ companies: any[] }> = ({ companies }) => {
  const [form] = Form.useForm()
  formRef = form
  mockBulkContext.current = {
    form,
    service,
    companies,
    prevService: null,
    prevPayments: [],
    isLoading: false,
    isError: false,
  }
  return (
    <Form form={form}>
      <InvoicesTable />
    </Form>
  )
}

const renderTable = (companies = [company('c1', 'Alpha')]) =>
  render(<Harness companies={companies} />)

const headerTitles = () =>
  Array.from(document.querySelectorAll('thead th'))
    .map((th) => th.textContent?.trim())
    .filter(Boolean)

const total = (row = 0) =>
  Number(screen.getAllByTestId('company-total')[row].textContent)

const invoiceSums = (row = 0) => {
  const inv = formRef.getFieldValue(['payments', row, 'invoice']) ?? {}
  return Object.values<any>(inv).reduce((a, i) => a + (+i?.sum || 0), 0)
}

// Чекбокс меню видимості (як на дашборді): відмічений = прихований.
const toggleColumnVisibility = async (label: string) => {
  fireEvent.click(screen.getByLabelText('Приховати колонки'))
  fireEvent.click(await screen.findByLabelText(label))
}

beforeEach(() => localStorage.clear())

describe('загальна сума по компанії', () => {
  it('показує суму всіх виставлених послуг компанії', async () => {
    renderTable()
    await waitFor(() => expect(total()).toBeGreaterThan(0))
    expect(total()).toBe(invoiceSums())
  })

  it('перераховується після зміни вартості послуги', async () => {
    renderTable()
    await waitFor(() => expect(total()).toBeGreaterThan(0))
    const before = total()
    act(() => {
      formRef.setFieldValue(
        ['payments', 0, 'invoice', 'placingPrice', 'price'],
        400
      )
    })
    await waitFor(() => expect(total()).not.toBe(before))
    expect(total()).toBe(invoiceSums())
  })
})

describe('Drag & Drop колонок', () => {
  it('змінює порядок колонок у таблиці', async () => {
    renderTable()
    await waitFor(() => expect(headerTitles()).toContain('Розміщення'))
    const idx = (t: string) => headerTitles().indexOf(t)
    expect(idx('Утримання')).toBeLessThan(idx('Розміщення'))

    act(() => {
      dnd.onDragEnd!({ active: { id: 'placing' }, over: { id: 'maintenance' } })
    })

    await waitFor(() =>
      expect(idx('Розміщення')).toBeLessThan(idx('Утримання'))
    )
  })
})

describe('приховування / відновлення колонок', () => {
  it('ховає колонку й повертає її кнопкою відновлення', async () => {
    renderTable()
    await waitFor(() => expect(total()).toBeGreaterThan(0))
    const before = total()
    expect(headerTitles()).toContain('Розміщення')

    await toggleColumnVisibility('Розміщення')
    await waitFor(() => expect(headerTitles()).not.toContain('Розміщення'))
    expect(total()).toBe(before)

    fireEvent.click(screen.getByLabelText('Відновити колонки'))
    await waitFor(() => expect(headerTitles()).toContain('Розміщення'))
    expect(total()).toBe(before)
  })
})

describe('приховані колонки та загальна сума', () => {
  it('сума враховує послугу, чию колонку приховано', async () => {
    renderTable()
    await waitFor(() => expect(total()).toBeGreaterThan(0))
    const visibleTotal = total()
    await toggleColumnVisibility('Розміщення')
    await waitFor(() => expect(headerTitles()).not.toContain('Розміщення'))
    expect(total()).toBe(visibleTotal)
  })

  it('колонка, прихована ще до першого рендеру, все одно обчислюється', async () => {
    const first = renderTable()
    await waitFor(() => expect(total()).toBeGreaterThan(0))
    const visibleTotal = total()
    first.unmount()

    localStorage.setItem(
      'payments-bulk-columns-user-1',
      JSON.stringify({ order: [], hidden: ['placing'] })
    )
    renderTable()

    await waitFor(() => expect(total()).toBe(visibleTotal))
    expect(headerTitles()).not.toContain('Розміщення')
  })

  it('перерахунок працює й коли колонка прихована', async () => {
    renderTable()
    await waitFor(() => expect(total()).toBeGreaterThan(0))
    await toggleColumnVisibility('Розміщення')
    await waitFor(() => expect(headerTitles()).not.toContain('Розміщення'))
    const before = total()

    act(() => {
      formRef.setFieldValue(
        ['payments', 0, 'invoice', 'placingPrice', 'price'],
        400
      )
    })
    await waitFor(() => expect(total()).not.toBe(before))
    expect(total()).toBe(invoiceSums())
  })
})
