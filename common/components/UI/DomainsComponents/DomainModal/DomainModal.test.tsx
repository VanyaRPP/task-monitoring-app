import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Form, Input } from 'antd'
import DomainModal from '.'

const editDomainMock = jest.fn()
const addDomainMock = jest.fn()
const editRealEstateMock = jest.fn()

jest.mock('@common/api/domainApi/domain.api', () => ({
  useAddDomainMutation: () => [addDomainMock, { isLoading: false }],
  useEditDomainMutation: () => [editDomainMock, { isLoading: false }],
  useGetDomainsQuery: () => ({ data: [] }),
  useGetDomainTypeTemplatesQuery: () => ({ data: [] }),
}))

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useEditRealEstateMutation: () => [editRealEstateMock],
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => ({ data: { email: 'admin@example.com' } }),
}))

// Replace the heavy DomainForm with a minimal stand-in that wraps the parent
// `form` in a Form context and registers required Form.Items so
// `form.getFieldsValue()` returns them. We exercise the save-flow plumbing
// inside DomainModal — form internals are covered separately.
//
// `data-testid="seed-areas-untouched"` button simulates AreaCalculationCard's
// init-fill: it stamps `companiesAreas` exactly as if API returned them and
// the user never edited them.
//
// `data-testid="seed-areas-touched"` simulates the user edited one company's
// area (so its current value diverges from `_initialArea`).
jest.mock('./DomainForm', () => ({
  __esModule: true,
  default: ({ form }: any) => {
    const seedUntouched = () =>
      form.setFieldsValue({
        companiesAreas: [
          {
            _id: 'rs-1',
            name: 'Acme',
            area: 100,
            rentPart: 50,
            _initialArea: 100,
            _initialRentPart: 50,
          },
          {
            _id: 'rs-2',
            name: 'Beta',
            area: 200,
            rentPart: 50,
            _initialArea: 200,
            _initialRentPart: 50,
          },
        ],
      })
    const seedTouched = () =>
      form.setFieldsValue({
        companiesAreas: [
          {
            _id: 'rs-1',
            name: 'Acme',
            area: 150, // user edited this
            rentPart: 60,
            _initialArea: 100,
            _initialRentPart: 50,
          },
          {
            _id: 'rs-2',
            name: 'Beta',
            area: 200,
            rentPart: 50,
            _initialArea: 200,
            _initialRentPart: 50,
          },
        ],
      })
    return (
      <Form form={form}>
        <Form.Item name="name">
          <Input data-testid="name-input" />
        </Form.Item>
        <Form.Item name="adminEmails" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="streets" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="description" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="defaultTemplate" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="iban" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="rnokpp" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="mfo" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="domainBankToken" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="customServices" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="IEName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="domainTypeTemplateId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="companiesAreas" hidden>
          <Input />
        </Form.Item>
        <button data-testid="seed-areas-untouched" type="button" onClick={seedUntouched}>
          seed-untouched
        </button>
        <button data-testid="seed-areas-touched" type="button" onClick={seedTouched}>
          seed-touched
        </button>
      </Form>
    )
  },
}))

const baseDomain = {
  _id: 'existing-id',
  name: 'Old Name',
  adminEmails: ['admin@example.com'],
  streets: [],
  description: '',
  domainBankToken: [],
  customServices: [],
}

describe('DomainModal — save flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls addDomain mutation with form payload when no currentDomain', async () => {
    addDomainMock.mockResolvedValue({ data: { _id: 'new-id' } })
    const closeModal = jest.fn()

    render(
      <DomainModal
        currentDomain={undefined as any}
        closeModal={closeModal}
        editable
      />
    )

    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'New Provider' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Додати/i }))

    await waitFor(() => {
      expect(addDomainMock).toHaveBeenCalledTimes(1)
    })
    const payload = addDomainMock.mock.calls[0][0]
    expect(payload.name).toBe('New Provider')
    expect(editDomainMock).not.toHaveBeenCalled()
  })

  it('calls editDomain mutation when currentDomain exists', async () => {
    editDomainMock.mockResolvedValue({ data: baseDomain })
    const closeModal = jest.fn()

    render(
      <DomainModal
        currentDomain={baseDomain as any}
        closeModal={closeModal}
        editable
      />
    )

    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Renamed Provider' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Зберегти/i }))

    await waitFor(() => {
      expect(editDomainMock).toHaveBeenCalledTimes(1)
    })
    const payload = editDomainMock.mock.calls[0][0]
    expect(payload._id).toBe('existing-id')
    expect(payload.name).toBe('Renamed Provider')
    expect(addDomainMock).not.toHaveBeenCalled()
    expect(closeModal).toHaveBeenCalled()
  })

  it('domain admin can rename and save (no companiesAreas → no realestate calls)', async () => {
    // This is the regression case: previously renaming a domain succeeded but
    // the post-save companiesAreas loop failed with "Виникла помилка при
    // оновленні даних площ" when the user hadn't touched any area inputs.
    editDomainMock.mockResolvedValue({ data: baseDomain })
    const closeModal = jest.fn()

    render(
      <DomainModal
        currentDomain={baseDomain as any}
        closeModal={closeModal}
        editable
      />
    )

    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Domain Admin Rename' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Зберегти/i }))

    await waitFor(() => {
      expect(editDomainMock).toHaveBeenCalled()
    })
    // editRealEstate must NOT fire when there are no company-area edits.
    expect(editRealEstateMock).not.toHaveBeenCalled()
    expect(closeModal).toHaveBeenCalled()
  })

  it('does NOT fire editRealEstate when AreaCalculationCard pre-filled but the user did not touch areas', async () => {
    // Real flow: open modal → AreaCalculationCard auto-seeds companiesAreas
    // from API → user only renames → save. Previously this looped
    // editRealEstate per company (potentially erroring with "Виникла помилка
    // при оновленні даних площ" for domain admins).
    editDomainMock.mockResolvedValue({ data: baseDomain })
    const closeModal = jest.fn()

    render(
      <DomainModal
        currentDomain={baseDomain as any}
        closeModal={closeModal}
        editable
      />
    )

    // Pretend AreaCalculationCard finished its init useEffect:
    fireEvent.click(screen.getByTestId('seed-areas-untouched'))
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Just renamed' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Зберегти/i }))

    await waitFor(() => {
      expect(editDomainMock).toHaveBeenCalled()
    })
    expect(editRealEstateMock).not.toHaveBeenCalled()
    expect(closeModal).toHaveBeenCalled()
  })

  it('fires editRealEstate ONLY for companies whose area actually changed', async () => {
    editDomainMock.mockResolvedValue({ data: baseDomain })
    editRealEstateMock.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    })
    const closeModal = jest.fn()

    render(
      <DomainModal
        currentDomain={baseDomain as any}
        closeModal={closeModal}
        editable
      />
    )

    // Simulate user editing one company's area:
    fireEvent.click(screen.getByTestId('seed-areas-touched'))
    fireEvent.click(screen.getByRole('button', { name: /Зберегти/i }))

    await waitFor(() => {
      expect(editDomainMock).toHaveBeenCalled()
    })
    expect(editRealEstateMock).toHaveBeenCalledTimes(1)
    expect(editRealEstateMock).toHaveBeenCalledWith({
      _id: 'rs-1',
      totalArea: 150,
      rentPart: 60,
    })
  })
})
