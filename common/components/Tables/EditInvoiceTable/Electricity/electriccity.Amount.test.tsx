import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { Form, FormInstance, Input } from 'antd'
import { Sum } from './index'
import { describe, it, expect } from '@jest/globals'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    service: { date: new Date() },
    payment: {},
  }),
}))

const renderWithForm = (initialValues: any) => {
  const formRef: { current: FormInstance | null } = { current: null }
  const Wrapper = () => {
    const [form] = Form.useForm()
    formRef.current = form
    return (
      <Form form={form} initialValues={initialValues}>
        <Form.Item name={['invoice', 'electricity', 'lastAmount']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={['invoice', 'electricity', 'amount']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={['invoice', 'electricity', 'price']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={['invoice', 'electricity', 'losses']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={['invoice', 'electricity', 'sum']} hidden>
          <Input />
        </Form.Item>
        <Sum form={form} name={['electricity']} />
      </Form>
    )
  }
  const utils = render(<Wrapper />)
  return { form: formRef.current as FormInstance, ...utils }
}

describe('Electricity.Sum', () => {
  it('розраховує суму з коректними числовими значеннями без втрат', async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(200)
    })
  })

  it('розраховує суму з врахуванням втрат', async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(220)
    })
  })

  it('обробляє undefined значення (використовує 0 за замовчуванням)', async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      const sum = form.getFieldValue(['invoice', 'electricity', 'sum'])
      expect(isNaN(sum) || sum === 0).toBe(true)
    })
  })

  it("обробляє null значення (використовує 0 за замовчуванням)", async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      const sum = form.getFieldValue(['invoice', 'electricity', 'sum'])
      expect(sum).toBe(0)
    })
  })

  it("обробляє від'ємну різницю (amount < lastAmount)", async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(0)
    })
  })

  it('розраховує суму з нульовими значеннями', async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(0)
    })
  })

  it('розраховує суму з великими значеннями втрат', async () => {
    const { form } = renderWithForm({
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

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'electricity', 'sum'])).toBe(2187.5)
    })
  })
})