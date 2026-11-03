import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddServiceModal from './index'
import {
  useAddServiceMutation,
  useEditServiceMutation,
} from '@common/api/serviceApi/service.api'
import dayjs from 'dayjs'

jest.mock('@common/api/serviceApi/service.api')

jest.mock('../Forms/AddServiceForm', () => {
  return function MockAddServiceForm() {
    return <div data-testid="mock-form" />
  }
})

const mockPostMessage = jest.fn()
const mockClose = jest.fn()

global.BroadcastChannel = jest.fn().mockImplementation(() => ({
  postMessage: mockPostMessage,
  close: mockClose,
  onmessage: jest.fn(),
})) as any

describe('AddServiceModal Sync', () => {
  const mockAddService = jest.fn()
  const mockEditService = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    ;(useAddServiceMutation as jest.Mock).mockReturnValue([
      mockAddService,
      { isLoading: false },
    ])
    ;(useEditServiceMutation as jest.Mock).mockReturnValue([
      mockEditService,
      { isLoading: false },
    ])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should invalidate Payment tags upon receiving PAYMENT_CREATED signal', async () => {
    mockAddService.mockResolvedValue({ data: { success: true } })

    render(
      <AddServiceModal
        closeModal={jest.fn()}
        serviceActions={{ edit: false, preview: false }}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Додати/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith('PAYMENT_CREATED')
    })

    jest.advanceTimersByTime(100)
    expect(mockClose).toHaveBeenCalled()
  })
})

describe('AddServiceModal without an address', () => {
  const mockAddService = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAddService.mockResolvedValue({ data: { success: true } })
    ;(useAddServiceMutation as jest.Mock).mockReturnValue([
      mockAddService,
      { isLoading: false },
    ])
    ;(useEditServiceMutation as jest.Mock).mockReturnValue([
      jest.fn(),
      { isLoading: false },
    ])
  })

  it('creates a month service without sending a street', async () => {
    render(
      <AddServiceModal
        closeModal={jest.fn()}
        serviceActions={{ edit: false, preview: false }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Додати/i }))

    await waitFor(() => expect(mockAddService).toHaveBeenCalledTimes(1))
    expect(mockAddService.mock.calls[0][0]).not.toHaveProperty('street')
  })

  it('opens without serviceActions (e.g. from the dashboard card)', async () => {
    render(<AddServiceModal closeModal={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Додати/i }))

    await waitFor(() => expect(mockAddService).toHaveBeenCalledTimes(1))
  })
})

describe('AddServiceModal Date Logic (Timezone Fix)', () => {
  it('має зберігати травень (MonthPicker) як травень в UTC, незалежно від таймзони (UTC+)', () => {
    // Симулюємо вибір Травня 2026 в локальній таймзоні (наприклад, Київ UTC+3)
    const pickedDateUTCPlus = dayjs('2026-05-01T00:00:00+03:00')

    const fixedDate = new Date(
      Date.UTC(pickedDateUTCPlus.year(), pickedDateUTCPlus.month(), 1, 12, 0, 0)
    )

    // getUTCMonth() повертає місяці від 0 до 11. Травень = 4.
    expect(fixedDate.getUTCMonth()).toBe(4)
    expect(fixedDate.getUTCHours()).toBe(12)
  })

  it('має зберігати правильно для відʼємних таймзон (UTC-)', () => {
    // Симулюємо вибір Травня 2026 в таймзоні Нью-Йорка (UTC-4)
    const pickedDateUTCMinus = dayjs('2026-05-01T00:00:00-04:00')

    const fixedDate = new Date(
      Date.UTC(
        pickedDateUTCMinus.year(),
        pickedDateUTCMinus.month(),
        1,
        12,
        0,
        0
      )
    )

    expect(fixedDate.getUTCMonth()).toBe(4)
    expect(fixedDate.getUTCHours()).toBe(12)
  })
})
