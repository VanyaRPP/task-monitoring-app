import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIChat from '.'

const mockSendMessage = jest.fn()

jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Привіт! Чим можу допомогти?' }],
      },
    ],
    setMessages: jest.fn(),
    sendMessage: mockSendMessage,
    status: 'ready',
    error: undefined,
  }),
}))

jest.mock('ai', () => ({
  DefaultChatTransport: class {},
}))

jest.mock('@modules/hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: true }),
}))

jest.mock('@modules/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ floatButtons: { menuOffset: 0 } }),
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => ({ data: { _id: 'u1' } }),
}))

jest.mock('@components/AddPaymentModal', () => ({
  __esModule: true,
  default: () => null,
}))

const mockImports = { batches: {}, start: jest.fn(), updateCard: jest.fn() }
jest.mock('./photoImport/useDocumentImports', () => ({
  useDocumentImports: () => mockImports,
}))

jest.mock('./photoImport/imageTools', () => ({ shrinkImage: jest.fn() }))

jest.mock('./photoImport/BatchCard', () => ({
  __esModule: true,
  default: () => null,
}))

class PointerEventPolyfill extends MouseEvent {
  public pointerId: number
  public isPrimary: boolean

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params)
    this.pointerId = params.pointerId ?? 1
    this.isPrimary = params.isPrimary ?? true
  }
}

beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    // @ts-expect-error jsdom has no PointerEvent
    window.PointerEvent = PointerEventPolyfill
  }
  Element.prototype.scrollIntoView = jest.fn()
})

beforeEach(() => {
  window.localStorage.clear()
  mockSendMessage.mockClear()
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1600,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 1000,
  })
})

const openChat = async (): Promise<HTMLElement> => {
  await userEvent.click(screen.getByRole('button', { name: 'AI Помічник' }))
  return screen.getByRole('dialog', { name: 'AI Помічник' })
}

describe('AIChat window controls', () => {
  it('згортає вікно, кнопка відкриття лишається з позначкою', async () => {
    const { container } = render(<AIChat />)
    await openChat()

    await userEvent.click(screen.getByRole('button', { name: 'Згорнути' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'AI Помічник' })
    ).toBeInTheDocument()
    expect(container.querySelector('.ant-badge-dot')).not.toBeNull()

    await openChat()
    expect(screen.getByText('Привіт! Чим можу допомогти?')).toBeVisible()
    expect(container.querySelector('.ant-badge-dot')).toBeNull()
  })

  it('закриває вікно без позначки', async () => {
    const { container } = render(<AIChat />)
    await openChat()

    await userEvent.click(screen.getByRole('button', { name: 'Закрити' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(container.querySelector('.ant-badge-dot')).toBeNull()
  })

  it('розгортає і повертає попередні розміри', async () => {
    render(<AIChat />)
    const chat = await openChat()
    expect(chat.style.width).toBe('450px')

    await userEvent.click(screen.getByRole('button', { name: 'Розгорнути' }))
    expect(chat.style.width).toBe('1440px')
    expect(chat.style.height).toBe('900px')

    await userEvent.click(screen.getByRole('button', { name: 'Відновити' }))
    expect(chat.style.width).toBe('450px')
    expect(chat.style.height).toBe('600px')
  })

  it('після перевідкриття вікно там, де його лишили', async () => {
    render(<AIChat />)
    const chat = await openChat()
    const header = screen.getByTestId('ai-chat-header')

    fireEvent.pointerDown(header, { button: 0, clientX: 500, clientY: 500 })
    fireEvent.pointerMove(window, { clientX: 400, clientY: 450 })
    fireEvent.pointerUp(window)
    const moved = { left: chat.style.left, top: chat.style.top }

    await userEvent.click(screen.getByRole('button', { name: 'Закрити' }))
    const reopened = await openChat()

    expect({ left: reopened.style.left, top: reopened.style.top }).toEqual(
      moved
    )
  })

  it('кнопки керування вікном не тягнуть вікно', async () => {
    render(<AIChat />)
    const chat = await openChat()
    const left = chat.style.left

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Розгорнути' }), {
      button: 0,
      clientX: 500,
      clientY: 500,
    })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(window)

    expect(chat.style.left).toBe(left)
  })

  it('чат працює як раніше: введення і надсилання', async () => {
    render(<AIChat />)
    await openChat()

    await userEvent.type(
      screen.getByPlaceholderText('Запитайте щось...'),
      'Скільки боргів?{Enter}'
    )

    expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Скільки боргів?' })
  })
})
