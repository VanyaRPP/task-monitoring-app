import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form } from 'antd'
import { LossesCollapse } from './LossesCollapse'

describe('LossesCollapse', () => {
  it('renders computed values and loss percentage', () => {
    const [form] = Form.useForm()

    // Set initial form values
    form.setFieldsValue({
      consumedElectricity: 100,
      generalElectricity: 120,
      customServices: [
        { fieldName: 'electricityPrice', price: 1.2 }
      ]
    })

    render(<LossesCollapse form={form} name="losses" />)

    // Total with VAT = 120 * 1.2 = 144
    expect(screen.getByText('144.00')).toBeInTheDocument()

    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('sets calculated losses value in the form', () => {
    const setFieldValue = jest.fn()
    const form = {
      setFieldValue,
      getFieldValue: jest.fn(),
      setFieldsValue: jest.fn(),
      getFieldsValues: jest.fn(),
      getInternalHooks: jest.fn(),
    } as any

    const mockValues = {
      consumedElectricity: 200,
      generalElectricity: 240,
      customServices: [
        { fieldName: 'electricityPrice', price: 10.7915 },
      ],
    }

    jest.spyOn(Form, 'useWatch')
      .mockImplementation((field: any) => mockValues[field as keyof typeof mockValues])

    render(<LossesCollapse form={form} name="losses" />)

    // Losses = total / (price * consumed) - 1 = 240 / (1 * 200) - 1 = 0.2 → 20%
    expect(setFieldValue).toHaveBeenCalledWith('losses', 20)
  })
})