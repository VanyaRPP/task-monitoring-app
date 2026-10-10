import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RealEstateModal from './index'

const editRealEstateMock = jest.fn().mockResolvedValue({ data: {} })
const addRealEstateMock = jest.fn().mockResolvedValue({ data: {} })

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useAddRealEstateMutation: () => [addRealEstateMock, { isLoading: false }],
  useEditRealEstateMutation: () => [editRealEstateMock, { isLoading: false }],
}))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: () => ({ data: { data: [] } }),
  useGetCustomServicesByDomainQuery: () => ({
    data: {
      data: [
        {
          groupName: 'Комунальні',
          services: [{ _id: 'svc-lift', name: 'Ліфт', fieldName: 'lift' }],
        },
      ],
    },
  }),
}))

jest.mock('../../ModalWindow', () => ({
  __esModule: true,
  default: ({ children, onOk }: any) => (
    <div>
      {children}
      <button onClick={onOk}>Зберегти</button>
    </div>
  ),
}))

let capturedForm: any = null
jest.mock('./RealEstateForm', () => ({
  __esModule: true,
  default: ({ form }: any) => {
    capturedForm = form
    return <div data-testid="real-estate-form" />
  },
}))

// What previewCompany hands the chat for «ТОВ Ромашка, 45 м², ліфт 12».
const draft = {
  domain: 'd1',
  street: 'streetA',
  companyName: 'ТОВ Ромашка',
  description: 'Договір 12 від 01.09.2026',
  adminEmails: ['owner@romashka.ua'],
  totalArea: 45,
  pricePerMeter: 120,
  currency: 'UAH',
  contractNumber: '12',
  contractDate: '2026-09-01',
  customServices: [
    { _id: 'svc-lift', fieldName: 'lift', label: 'Ліфт', price: 12 },
  ],
} as any

describe('RealEstateModal with a draft', () => {
  afterEach(() => {
    jest.clearAllMocks()
    capturedForm = null
  })

  it('opens prefilled from the draft', () => {
    render(
      <RealEstateModal
        chosenRealEstate={{ domain: 'd1', street: 'streetA' }}
        draft={draft}
        closeModal={jest.fn()}
        editable
      />
    )

    expect(capturedForm.getFieldsValue(true)).toMatchObject({
      domain: 'd1',
      street: 'streetA',
      companyName: 'ТОВ Ромашка',
      description: 'Договір 12 від 01.09.2026',
      adminEmails: ['owner@romashka.ua'],
      totalArea: 45,
      pricePerMeter: 120,
      contractNumber: '12',
      customServices: [
        { _id: 'svc-lift', fieldName: 'lift', label: 'Ліфт', price: 12 },
      ],
    })
    expect(
      capturedForm.getFieldValue('contractDate').format('YYYY-MM-DD')
    ).toBe('2026-09-01')
  })

  it('saves as a new company, not as an edit', async () => {
    render(
      <RealEstateModal
        chosenRealEstate={{ domain: 'd1', street: 'streetA' }}
        draft={draft}
        closeModal={jest.fn()}
        editable
      />
    )

    fireEvent.click(screen.getByText('Зберегти'))

    await waitFor(() => expect(addRealEstateMock).toHaveBeenCalledTimes(1))
    expect(editRealEstateMock).not.toHaveBeenCalled()
  })
})
