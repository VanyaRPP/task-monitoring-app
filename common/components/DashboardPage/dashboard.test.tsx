import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { arrayMove } from '@dnd-kit/sortable'
import { Roles } from '@utils/constants'
import Dashboard, { WidgetKey } from '@components/DashboardPage'

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(() => ({
    data: { _id: 'user-123', roles: [Roles.GLOBAL_ADMIN] },
  })),
}))

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(() => undefined),
}))

jest.mock('antd', () => {
  const antd = jest.requireActual('antd')
  return {
    ...antd,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
      destroy: jest.fn(),
    },
  }
})

jest.mock('@modules/hooks/useFloatButton', () => ({
  ...jest.requireActual('@modules/hooks/useFloatButton'),
  useDragDropPanelFloatButton: () => [
    true,
    jest.fn(),
    {
      key: 'dragdroppanel-dashboard',
      icon: null,
      onClick: jest.fn(),
      tooltip: '',
    },
  ],
}))

jest.mock('@components/DashboardPage/DashboardTour', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@components/UI/WidgetWrapper', () => ({
  WidgetWrapper: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@components/DashboardPage/blocks/payments', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/DashboardPage/blocks/paymentChart', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/Pages/ProfiitPage', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/DashboardPage/blocks/streets', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/DashboardPage/blocks/domains', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/DashboardPage/blocks/realEstates', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@components/DashboardPage/blocks/services', () => ({
  __esModule: true,
  default: () => null,
}))
// jest.mock('@components/DashboardPage/blocks/сompaniesAreaChart', () => ({
//   __esModule: true,
//   default: () => null,
// }))

class PointerEventPolyfill extends MouseEvent {
  public pointerId: number
  public isPrimary: boolean
  public pointerType: string

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params)
    this.pointerId = params.pointerId ?? 1
    this.isPrimary = params.isPrimary ?? true
    this.pointerType = params.pointerType ?? 'mouse'
  }
}

beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    // @ts-expect-error jsdom
    window.PointerEvent = PointerEventPolyfill
  }
})

const ALL_WIDGETS: WidgetKey[] = [
  'payments',
  'paymentsChart',
  'profits',
  'streets',
  'domain',
  'realEstate',
  'services',
  // 'companies',
]

interface RectInit {
  x: number
  y: number
  width: number
  height: number
}

function assertFound<T>(value: T | null | undefined, description: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Тестовий helper не знайшов ${description} у DOM`)
  }
  return value
}

function stubRect(el: HTMLElement, { x, y, width, height }: RectInit): void {
  el.getBoundingClientRect = () =>
    ({
      x,
      y,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect
}

function stubGridLayout(container: HTMLElement): void {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>('.dashboard-grid > div')
  )
  items.forEach((el, index) =>
    stubRect(el, { x: 0, y: index * 80, width: 300, height: 70 })
  )
}

function stubToolbarLayout(buttons: HTMLElement[]): void {
  buttons.forEach((el, index) =>
    stubRect(el, { x: index * 120, y: 0, width: 100, height: 32 })
  )
}

function center(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function getWidgetEl(id: WidgetKey): HTMLElement {
  return assertFound(document.getElementById(id), `віджет з id="${id}"`)
}

function getToolbarButton(label: string): HTMLElement {
  return assertFound(
    screen.getByText(label).closest('div'),
    `toolbar-кнопку з текстом "${label}"`
  )
}

function getIconButton(
  container: HTMLElement,
  iconClass: string
): HTMLButtonElement {
  const icon = container.querySelector(`.${iconClass}`)
  return assertFound(icon?.closest('button'), `кнопку з іконкою .${iconClass}`)
}

function getSaveButton(container: HTMLElement): HTMLButtonElement {
  return getIconButton(container, 'anticon-save')
}

function getRevertButton(container: HTMLElement): HTMLButtonElement {
  return getIconButton(container, 'anticon-undo')
}

function dragPointer(fromEl: HTMLElement, toEl: HTMLElement): Promise<void> {
  const start = center(fromEl)
  const end = center(toEl)

  fireEvent.pointerDown(fromEl, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: start.x,
    clientY: start.y,
  })

  fireEvent.pointerMove(document, {
    pointerId: 1,
    clientX: start.x,
    clientY: start.y + 10,
  })

  fireEvent.pointerMove(document, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
  })

  fireEvent.pointerUp(document, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
  })

  return new Promise<void>((resolve) => setTimeout(resolve, 60))
}

beforeEach(() => {
  localStorage.clear()
})

describe('Dashboard — basic behaviors', () => {
  it('Всі таблиці: рендерить усі 7 віджетів за замовчуванням', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      ALL_WIDGETS.forEach((id) => {
        expect(document.getElementById(id)).toBeInTheDocument()
      })
    })
  })

  it('Дія "Відновити": очищає localStorage і скидає стан до початкового', async () => {
    const { container } = render(<Dashboard />)
    await waitFor(() =>
      expect(document.getElementById('payments')).toBeInTheDocument()
    )

    stubGridLayout(container)
    await dragPointer(getWidgetEl('payments'), getWidgetEl('streets'))
    fireEvent.click(getSaveButton(container))

    expect(localStorage.getItem('dashboard-layout-user-123')).not.toBeNull()

    const revertBtn = getRevertButton(container)
    expect(revertBtn).toBeInTheDocument()
    fireEvent.click(revertBtn)
    expect(localStorage.getItem('dashboard-layout-user-123')).toBeNull()
  })

  it('Збереження у local Storage: коректно зберігає і layout, і hidden одночасно', async () => {
    localStorage.setItem(
      'dashboard-layout-user-123',
      JSON.stringify({ layout: ALL_WIDGETS, hidden: ['streets'] })
    )

    const { container } = render(<Dashboard />)
    await waitFor(() =>
      expect(document.getElementById('payments')).toBeInTheDocument()
    )

    expect(document.getElementById('streets')).not.toBeInTheDocument()

    stubGridLayout(container)
    await dragPointer(getWidgetEl('payments'), getWidgetEl('profits'))

    fireEvent.click(getSaveButton(container))

    const raw = localStorage.getItem('dashboard-layout-user-123')
    const saved = JSON.parse(raw as string)

    expect(saved).toHaveProperty('layout')
    expect(saved).toHaveProperty('hidden')
    expect(Array.isArray(saved.layout)).toBe(true)
    expect(Array.isArray(saved.hidden)).toBe(true)
    expect(saved.hidden).toContain('streets')
    expect(saved.layout).toEqual(arrayMove(ALL_WIDGETS, 0, 2))
  })

  it('Приховання та відображення: читає стан hidden з localStorage та коректно скидає його через "Відновити"', async () => {
    localStorage.setItem(
      'dashboard-layout-user-123',
      JSON.stringify({ layout: ALL_WIDGETS, hidden: ['streets'] })
    )

    const { container } = render(<Dashboard />)

    await waitFor(() => {
      expect(document.getElementById('streets')).not.toBeInTheDocument()
    })

    const revertBtn = getRevertButton(container)
    expect(revertBtn).toBeInTheDocument()
    fireEvent.click(revertBtn)

    await waitFor(() => {
      expect(document.getElementById('streets')).toBeInTheDocument()
    })
    expect(localStorage.getItem('dashboard-layout-user-123')).toBeNull()
  })
})

describe('Dashboard — Drag & Drop', () => {
  it('DnD сітки: перетягування картки змінює порядок і коректно зберігається', async () => {
    const { container } = render(<Dashboard />)
    await waitFor(() =>
      expect(document.getElementById('payments')).toBeInTheDocument()
    )

    stubGridLayout(container)
    const payments = getWidgetEl('payments')
    const streets = getWidgetEl('streets')

    await dragPointer(payments, streets)
    fireEvent.click(getSaveButton(container))

    const raw = localStorage.getItem('dashboard-layout-user-123')
    expect(raw).not.toBeNull()
    const saved = JSON.parse(raw as string)

    expect(saved.layout).toEqual(
      arrayMove(ALL_WIDGETS, 0, ALL_WIDGETS.indexOf('streets'))
    )
  })

  it('DnD тулбара: коректно обробляє префікс "toolbar-" через getWidgetKey', async () => {
    const { container } = render(<Dashboard />)
    await waitFor(() =>
      expect(document.getElementById('payments')).toBeInTheDocument()
    )

    const servicesBtn = getToolbarButton('Послуги')
    const paymentsBtn = getToolbarButton('Платежі')

    stubToolbarLayout([paymentsBtn, servicesBtn])

    await dragPointer(servicesBtn, paymentsBtn)
    fireEvent.click(getSaveButton(container))

    const raw = localStorage.getItem('dashboard-layout-user-123')
    const saved = JSON.parse(raw as string)

    expect(saved.layout).toEqual(
      arrayMove(
        ALL_WIDGETS,
        ALL_WIDGETS.indexOf('services'),
        ALL_WIDGETS.indexOf('payments')
      )
    )
  })

  it('DnD no-op: перетягування елемента на саме себе не змінює порядок', async () => {
    const { container } = render(<Dashboard />)
    await waitFor(() =>
      expect(document.getElementById('payments')).toBeInTheDocument()
    )

    stubGridLayout(container)
    const payments = getWidgetEl('payments')

    await dragPointer(payments, payments)
    fireEvent.click(getSaveButton(container))

    const raw = localStorage.getItem('dashboard-layout-user-123')
    const saved = JSON.parse(raw as string)

    expect(saved.layout).toEqual(ALL_WIDGETS)
  })
})
