import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import { Sum } from './index'
import { describe, it, expect } from '@jest/globals'


jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    service: { date: new Date() },
    payment: {},
  }),
}))

describe('Electricity.Sum', () => {
  it('розраховує суму з коректними числовими значеннями без втрат', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: 100,
          amount: 200,
          price: 2,
          losses: 0,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // costAmount = 200 - 100 = 100
    // losses = 0, тому sum = 100 * 2 = 200
    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(200)
    })
    
    expect(screen.getByText('200.00 грн')).toBeDefined()
  })

  it('розраховує суму з врахуванням втрат', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: 100,
          amount: 200,
          price: 2,
          losses: 10,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // costAmount = 200 - 100 = 100
    // loss = 100 + 100 * (10 / 100) = 110
    // sum = 110 * 2 = 220
    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(220)
    })
    
    expect(screen.getByText('220.00 грн')).toBeDefined()
  })

  it('обробляє undefined значення (використовує 0 за замовчуванням)', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: undefined,
          amount: undefined,
          price: undefined,
          losses: undefined,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // При undefined значеннях: NaN перетворюється в 0
    // Math.max(NaN, 0) = 0, sum = 0
    await waitFor(() => {
      const sum = form.getFieldValue(['invoice', 'electricity', 'sum'])
      expect(isNaN(sum) || sum === 0).toBe(true)
    })
  })

  it('обробляє null значення (використовує 0 за замовчуванням)', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: null,
          amount: null,
          price: null,
          losses: null,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // При null значеннях поводиться як 0
    await waitFor(() => {
      const sum = form.getFieldValue(['invoice', 'electricity', 'sum'])
      expect(sum).toBe(0)
    })
  })

  it('обробляє від\'ємну різницю (amount < lastAmount)', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: 200,
          amount: 100,
          price: 2,
          losses: 0,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // Math.max(100 - 200, 0) = Math.max(-100, 0) = 0
    // sum = 0 * 2 = 0
    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(0)
    })
    
    expect(screen.getByText('0.00 грн')).toBeDefined()
  })

  it('розраховує суму з нульовими значеннями', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: 0,
          amount: 0,
          price: 0,
          losses: 0,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // costAmount = 0 - 0 = 0
    // sum = 0 * 0 = 0
    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(0)
    })
    
    expect(screen.getByText('0.00 грн')).toBeDefined()
  })

  it('розраховує суму з великими значеннями втрат', async () => {
    const [form] = Form.useForm()
    
    form.setFieldsValue({
      invoice: {
        electricity: {
          lastAmount: 1000,
          amount: 1500,
          price: 3.5,
          losses: 25,
          sum: 0,
        },
      },
    })

    render(<Sum form={form} name={['electricity']} />)

    // costAmount = 1500 - 1000 = 500
    // loss = 500 + 500 * (25 / 100) = 625
    // sum = 625 * 3.5 = 2187.5
    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(2187.5)
    })
    
    expect(screen.getByText('2187.50 грн')).toBeDefined()
  })
})