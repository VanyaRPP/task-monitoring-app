import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddServiceModal from './index'
import {
  useAddServiceMutation,
  useEditServiceMutation,
} from '@common/api/serviceApi/service.api'

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
