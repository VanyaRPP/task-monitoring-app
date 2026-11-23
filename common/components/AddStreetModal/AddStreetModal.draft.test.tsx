import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddStreetModal from './index'

const addStreetMock = jest.fn()

jest.mock('@common/api/streetApi/street.api', () => ({
  useAddStreetMutation: () => [addStreetMock, { isLoading: false }],
  useEditStreetMutation: () => [jest.fn(), { isLoading: false }],
  useGetCitiesAutocompleteQuery: () => ({ data: [] }),
  useSearchStreetsQuery: () => ({ data: undefined }),
}))

jest.mock('@components/UI/ModalWindow', () => ({
  __esModule: true,
  default: ({ children, onOk }: any) => (
    <div>
      {children}
      <button onClick={onOk}>Додати</button>
    </div>
  ),
}))

// What previewStreet hands the chat for «додай Шевченка 5, Львів».
const draft = { domain: 'dom-1', address: 'вул. Шевченка, 5', city: 'Львів' }

describe('AddStreetModal with a draft', () => {
  beforeEach(() => {
    addStreetMock.mockReset().mockResolvedValue({ data: { _id: 'st-new' } })
  })

  it('opens prefilled, with the address editable', async () => {
    render(<AddStreetModal draft={draft} closeModal={jest.fn()} />)

    const address = await screen.findByDisplayValue('вул. Шевченка, 5')
    expect(screen.getByDisplayValue('Львів')).toBeInTheDocument()
    await waitFor(() => expect(address).toBeEnabled())
  })

  it("saves it into the draft's domain", async () => {
    const closeModal = jest.fn()
    render(<AddStreetModal draft={draft} closeModal={closeModal} />)
    await screen.findByDisplayValue('вул. Шевченка, 5')

    await userEvent.click(screen.getByRole('button', { name: 'Додати' }))

    await waitFor(() =>
      expect(addStreetMock).toHaveBeenCalledWith({
        city: 'Львів',
        address: 'вул. Шевченка, 5',
        domain: 'dom-1',
      })
    )
    expect(closeModal).toHaveBeenCalled()
  })
})
