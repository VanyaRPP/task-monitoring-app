import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form } from 'antd'
import { LossesCollapse } from './LossesCollapse'

const makeForm = () => ({
  setFieldValue: jest.fn(),
  getFieldValue: jest.fn(),
  setFieldsValue: jest.fn(),
  getFieldsValues: jest.fn(),
  getInternalHooks: jest.fn(),
})

const mockUseWatch = (values: Record<string, any>) => {
  jest
    .spyOn(Form, 'useWatch')
    .mockImplementation((field: any) => values[field as keyof typeof values])
}

describe('LossesCollapse', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders computed values and loss percentage when expanded', () => {
    mockUseWatch({
      consumedElectricity: 100,
      generalElectricity: 120,
      customServices: [{ fieldName: 'electricityPrice', price: 1.2 }],
    })

    render(<LossesCollapse form={makeForm() as any} name="losses" />)

    fireEvent.click(
      screen.getByText('Втрати в трансформаторі, лініях, реактивна (%)')
    )

    // Total with VAT = 120 * 1.2 = 144
    expect(screen.getByText('144.00')).toBeInTheDocument()
    expect(screen.getAllByText(/%/).length).toBeGreaterThan(0)
  })

  it('sets calculated losses value in the form', () => {
    const form = makeForm()

    mockUseWatch({
      consumedElectricity: 200,
      generalElectricity: 240,
      // pricekWHWithVAT = 1.2 → pricekWH = 1
      // totalFromTariff = 1 * 200 = 200
      // losses = 240/200 - 1 = 0.2 → 20%
      customServices: [{ fieldName: 'electricityPrice', price: 1.2 }],
    })

    render(<LossesCollapse form={form as any} name="losses" />)

    expect(form.setFieldValue).toHaveBeenCalledWith('losses', 20)
  })

  it('does NOT overwrite a saved losses value while upstream inputs are still loading', () => {
    // Regression: opening service edit briefly resets `losses` to 0 because
    // `consumedElectricity`/`generalElectricity` arrive after first render.
    // The saved value must survive until inputs settle.
    const form = makeForm()
    form.getFieldValue.mockReturnValue(15.35)

    mockUseWatch({
      // upstream watchers return undefined → falsy → 0/0 = NaN
      consumedElectricity: undefined,
      generalElectricity: undefined,
      customServices: [{ fieldName: 'electricityPrice', price: 1.2 }],
    })

    render(<LossesCollapse form={form as any} name="losses" />)

    expect(form.setFieldValue).not.toHaveBeenCalled()
  })

  it('still seeds 0 on a fresh (empty) form when computation is NaN', () => {
    const form = makeForm()
    form.getFieldValue.mockReturnValue(undefined)

    mockUseWatch({
      consumedElectricity: undefined,
      generalElectricity: undefined,
      customServices: [{ fieldName: 'electricityPrice', price: 1.2 }],
    })

    render(<LossesCollapse form={form as any} name="losses" />)

    expect(form.setFieldValue).toHaveBeenCalledWith('losses', 0)
  })

  it('skips overwrite when computation yields Infinity (price=0 case) but value is already set', () => {
    const form = makeForm()
    form.getFieldValue.mockReturnValue(7.5)

    mockUseWatch({
      consumedElectricity: 100,
      generalElectricity: 50,
      // electricityPrice=0 → totalFromTariff=0 → 50/0 = Infinity
      customServices: [{ fieldName: 'electricityPrice', price: 0 }],
    })

    render(<LossesCollapse form={form as any} name="losses" />)

    expect(form.setFieldValue).not.toHaveBeenCalled()
  })
})
