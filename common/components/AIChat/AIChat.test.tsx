import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIChat from '.'

const mockSendMessage = jest.fn()
const mockRegenerate = jest.fn()
const mockStop = jest.fn()

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  parts: [{ type: 'text', text: 'Привіт! Чим можу допомогти?' }],
}

const mockChat: {
  messages: unknown[]
  status: string
  error: Error | undefined
} = { messages: [WELCOME], status: 'ready', error: undefined }

jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    ...mockChat,
    setMessages: jest.fn(),
    sendMessage: mockSendMessage,
    regenerate: mockRegenerate,
    stop: mockStop,
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

jest.mock('@components/AddCostModal', () => ({
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
  mockRegenerate.mockClear()
  mockStop.mockClear()
  mockChat.messages = [WELCOME]
  mockChat.status = 'ready'
  mockChat.error = undefined
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

  it('введений текст не зникає після розгортання, згортання і перевідкриття', async () => {
    render(<AIChat />)
    await openChat()
    await userEvent.type(field(), 'Чернетка питання')

    await userEvent.click(screen.getByRole('button', { name: 'Розгорнути' }))
    expect(field()).toHaveValue('Чернетка питання')

    await userEvent.click(screen.getByRole('button', { name: 'Згорнути' }))
    await openChat()
    expect(field()).toHaveValue('Чернетка питання')
  })

  it('введений текст не зникає після перетягування і resize', async () => {
    const { container } = render(<AIChat />)
    const chat = await openChat()
    await userEvent.type(field(), 'Не загубити')

    fireEvent.pointerDown(screen.getByTestId('ai-chat-header'), {
      button: 0,
      clientX: 500,
      clientY: 500,
    })
    fireEvent.pointerMove(window, { clientX: 300, clientY: 400 })
    fireEvent.pointerUp(window)
    const handle = container.querySelector('[data-resize-edge="w"]')
    fireEvent.pointerDown(handle as Element, {
      button: 0,
      clientX: 300,
      clientY: 400,
    })
    fireEvent.pointerMove(window, { clientX: 200, clientY: 400 })
    fireEvent.pointerUp(window)

    expect(chat.style.width).not.toBe('450px')
    expect(field()).toHaveValue('Не загубити')
  })

  it('кнопки header показують підказку і при фокусі з клавіатури', async () => {
    render(<AIChat />)
    await openChat()

    act(() => {
      screen.getByRole('button', { name: 'Згорнути' }).focus()
    })

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Згорнути')
  })

  it('історію можна прокручувати з клавіатури', async () => {
    render(<AIChat />)
    await openChat()

    const history = screen.getByRole('region', { name: 'Повідомлення чату' })
    expect(history).toHaveAttribute('tabindex', '0')
  })
})

const field = (): HTMLElement =>
  screen.getByRole('textbox', { name: 'Повідомлення AI-помічнику' })

const question = {
  id: 'q1',
  role: 'user',
  parts: [{ type: 'text', text: 'Які компанії мають борг?' }],
}

const answer = (parts: unknown[], id = 'a1') => ({
  id,
  role: 'assistant',
  parts,
})

describe('AIChat messages', () => {
  it('показує Markdown відповіді без службових символів', async () => {
    mockChat.messages = [
      WELCOME,
      question,
      answer([{ type: 'text', text: 'Вкажіть **Назву компанії**' }]),
    ]
    render(<AIChat />)
    const chat = await openChat()

    expect(screen.getByText('Назву компанії').tagName).toBe('STRONG')
    expect(chat.textContent).not.toContain('**')
  })

  it('текст користувача показує як є, без Markdown', async () => {
    mockChat.messages = [
      WELCOME,
      { ...question, parts: [{ type: 'text', text: '**не жирний**' }] },
    ]
    render(<AIChat />)
    await openChat()

    expect(screen.getByText('**не жирний**')).toBeInTheDocument()
  })

  it('копіює відповідь і коротко показує успіх', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    mockChat.messages = [
      WELCOME,
      question,
      answer([{ type: 'text', text: 'ТОВ **Альфа**' }]),
    ]
    render(<AIChat />)
    await openChat()

    await userEvent.click(
      screen.getByRole('button', { name: 'Копіювати відповідь' })
    )

    expect(writeText).toHaveBeenCalledWith('ТОВ **Альфа**')
    expect(
      await screen.findByRole('button', { name: 'Скопійовано' })
    ).toBeInTheDocument()
  })

  it('повторно генерує лише останню відповідь', async () => {
    mockChat.messages = [
      WELCOME,
      question,
      answer([{ type: 'text', text: 'Перша' }], 'a1'),
      { ...question, id: 'q2' },
      answer([{ type: 'text', text: 'Друга' }], 'a2'),
    ]
    render(<AIChat />)
    await openChat()

    const buttons = screen.getAllByRole('button', {
      name: 'Згенерувати ще раз',
    })
    expect(buttons).toHaveLength(1)

    await userEvent.click(buttons[0])
    expect(mockRegenerate).toHaveBeenCalledWith({ messageId: 'a2' })
  })

  it('не дає перегенерувати відповідь, що відкрила форму з чернеткою', async () => {
    mockChat.messages = [
      WELCOME,
      question,
      answer([
        {
          type: 'tool-previewExpenses',
          toolCallId: 't1',
          state: 'output-available',
          output: { draft: { items: [] } },
        },
        { type: 'text', text: 'Відкрив форму витрат.' },
      ]),
    ]
    render(<AIChat />)
    await openChat()

    expect(
      screen.getByRole('button', { name: 'Згенерувати ще раз' })
    ).toBeDisabled()
  })

  it('вітання не має дій', async () => {
    render(<AIChat />)
    await openChat()

    expect(
      screen.queryByRole('button', { name: 'Копіювати відповідь' })
    ).not.toBeInTheDocument()
  })

  it('під час генерації показує індикатор і дає зупинити', async () => {
    mockChat.messages = [WELCOME, question]
    mockChat.status = 'submitted'
    render(<AIChat />)
    await openChat()

    expect(screen.getByRole('status')).toHaveTextContent('Генерую відповідь')
    await userEvent.click(
      screen.getByRole('button', { name: 'Зупинити генерацію' })
    )
    expect(mockStop).toHaveBeenCalledTimes(1)
  })

  it('індикатор видно, поки відповідь ще без тексту (виклик інструменту)', async () => {
    mockChat.messages = [
      WELCOME,
      question,
      answer([{ type: 'tool-findCompanies', state: 'input-available' }]),
    ]
    mockChat.status = 'streaming'
    render(<AIChat />)
    await openChat()

    expect(screen.getByRole('status')).toBeInTheDocument()
    // The answer being streamed has no actions yet.
    expect(
      screen.queryByRole('button', { name: 'Згенерувати ще раз' })
    ).not.toBeInTheDocument()
  })

  it('при помилці зберігає історію і дає повторити запит', async () => {
    mockChat.messages = [WELCOME, question]
    mockChat.status = 'error'
    mockChat.error = new Error('Failed to fetch')
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(<AIChat />)
    await openChat()

    expect(screen.getByText('Які компанії мають борг?')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent("Немає з'єднання")
    // Next's dev overlay would report a console.error(Error) as a crash.
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.anything(),
      mockChat.error
    )

    await userEvent.click(screen.getByRole('button', { name: /Повторити/ }))
    expect(mockRegenerate).toHaveBeenCalledTimes(1)
  })

  it('показує «До останнього повідомлення», коли історію прокрутили вгору', async () => {
    render(<AIChat />)
    await openChat()
    const scroller = screen.getByTestId('ai-chat-messages')
    Object.defineProperties(scroller, {
      scrollHeight: { configurable: true, value: 2000 },
      clientHeight: { configurable: true, value: 400 },
    })

    scroller.scrollTop = 100
    act(() => {
      fireEvent.scroll(scroller)
    })
    const jump = screen.getByRole('button', {
      name: 'До останнього повідомлення',
    })

    await userEvent.click(jump)
    expect(
      screen.queryByRole('button', { name: 'До останнього повідомлення' })
    ).not.toBeInTheDocument()
  })
})

describe('AIChat statement files', () => {
  beforeEach(() => mockImports.start.mockReset().mockReturnValue('batch-1'))

  const pick = async (file: File) => {
    await openChat()
    await userEvent.upload(screen.getByTestId('ai-chat-photo-input'), file)
  }

  it('reads a picked PDF as a statement, not as a photo', async () => {
    render(<AIChat />)
    await pick(new File(['%PDF-1.4'], 'кв. 7.pdf', { type: 'application/pdf' }))

    expect(mockImports.start).toHaveBeenCalledWith([
      {
        name: 'кв. 7.pdf',
        url: expect.stringMatching(/^data:application\/pdf;base64,/),
        kind: 'pdf',
      },
    ])
  })

  it('refuses a PDF too big for the server', async () => {
    render(<AIChat />)
    await pick(
      new File([new Uint8Array(3 * 1024 * 1024)], 'великий.pdf', {
        type: 'application/pdf',
      })
    )

    expect(mockImports.start).not.toHaveBeenCalled()
  })

  it('shows a sent PDF by its name', async () => {
    mockChat.messages = [
      WELCOME,
      {
        id: 'files-1',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'application/pdf',
            filename: 'кв. 7.pdf',
            url: 'data:application/pdf;base64,JVBERi0=',
          },
        ],
      },
    ]
    render(<AIChat />)
    await openChat()

    expect(screen.getByText('кв. 7.pdf')).toBeInTheDocument()
  })
})
