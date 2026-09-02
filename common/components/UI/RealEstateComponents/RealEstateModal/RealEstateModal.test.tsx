import { render, screen, fireEvent } from '@testing-library/react'
import RealEstateModal from './index'

const editRealEstateMock = jest.fn().mockResolvedValue({ data: {} })
const addRealEstateMock = jest.fn().mockResolvedValue({ data: {} })

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useAddRealEstateMutation: () => [addRealEstateMock, { isLoading: false }],
  useEditRealEstateMutation: () => [editRealEstateMock, { isLoading: false }],
}))

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesQuery: () => ({ data: { data: [] } }),
  useGetCustomServicesByDomainQuery: () => ({ data: { data: [] } }),
}))

jest.mock('../../ModalWindow', () => ({
  __esModule: true,
  default: ({ children, onCancel, onOk }: any) => (
    <div>
      {children}
      <button onClick={onCancel}>Відміна</button>
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

const companyA = {
  _id: 'a1',
  domain: { _id: 'd1' },
  street: { _id: 'streetA' },
  companyName: 'Компанія А',
} as any

const companyB = {
  _id: 'b1',
  domain: { _id: 'd1' },
  street: { _id: 'streetB' },
  companyName: 'Компанія Б',
} as any

describe('RealEstateModal — стан форми редагування', () => {
  afterEach(() => {
    jest.clearAllMocks()
    capturedForm = null
  })

  it('відкриття форми редагування компанії відображає актуальні дані', () => {
    render(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={jest.fn()}
        currentRealEstate={companyA}
        editable
      />
    )

    expect(capturedForm.getFieldValue('street')).toBe('streetA')
    expect(capturedForm.getFieldValue('companyName')).toBe('Компанія А')
  })

  it('повторне відкриття/перемикання на іншу компанію не переносить застарілу адресу з попереднього редагування', () => {
    const { rerender } = render(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={jest.fn()}
        currentRealEstate={companyA}
        editable
      />
    )
    expect(capturedForm.getFieldValue('street')).toBe('streetA')

    // Компанія редагування змінилась (наприклад, клік "Редагувати" по іншому
    // рядку) без розмонтування самої модалки.
    rerender(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={jest.fn()}
        currentRealEstate={companyB}
        editable
      />
    )

    expect(capturedForm.getFieldValue('street')).toBe('streetB')
    expect(capturedForm.getFieldValue('companyName')).toBe('Компанія Б')
  })

  it('значення полів із попереднього редагування не переносяться в наступне відкриття (скидання при закритті)', () => {
    const closeModal = jest.fn()
    render(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={closeModal}
        currentRealEstate={companyA}
        editable
      />
    )
    expect(capturedForm.getFieldValue('street')).toBe('streetA')

    fireEvent.click(screen.getByText('Відміна'))

    expect(capturedForm.getFieldValue('street')).toBeUndefined()
    expect(capturedForm.getFieldValue('companyName')).toBeUndefined()
    expect(closeModal).toHaveBeenCalledTimes(1)
  })

  it('домен ("Домен") скидається після закриття форми', () => {
    render(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={jest.fn()}
        currentRealEstate={companyA}
        editable
      />
    )
    expect(capturedForm.getFieldValue('domain')).toBe('d1')

    fireEvent.click(screen.getByText('Відміна'))

    expect(capturedForm.getFieldValue('domain')).toBeUndefined()
  })

  it('після повторного відкриття для тієї ж компанії відображається її актуальний домен, а не порожнє/чуже значення', () => {
    const { rerender } = render(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={jest.fn()}
        currentRealEstate={companyA}
        editable
      />
    )
    expect(capturedForm.getFieldValue('domain')).toBe('d1')

    fireEvent.click(screen.getByText('Відміна'))
    expect(capturedForm.getFieldValue('domain')).toBeUndefined()

    // Модалка розмонтовується і монтується заново — типова поведінка при
    // повторному відкритті через умовний рендер у Header.tsx.
    rerender(<></>)
    rerender(
      <RealEstateModal
        chosenRealEstate={null}
        closeModal={jest.fn()}
        currentRealEstate={companyA}
        editable
      />
    )

    expect(capturedForm.getFieldValue('domain')).toBe('d1')
  })
})
