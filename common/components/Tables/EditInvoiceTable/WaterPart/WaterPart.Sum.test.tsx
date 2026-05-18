import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { Form, FormInstance, Input } from 'antd'
import { Sum } from './index'
import { describe, it, expect } from '@jest/globals'

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    service: {},
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
        <Form.Item name={['invoice', 'WaterPart', 'price']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={['invoice', 'WaterPart', 'sum']} hidden>
          <Input />
        </Form.Item>
        <Sum form={form} name={['WaterPart']} />
      </Form>
    )
  }
  const utils = render(<Wrapper />)
  return { form: formRef.current as FormInstance, ...utils }
}

describe('WaterPart.Sum', () => {
  it('correct sum with numeric price', async () => {
    const { form } = renderWithForm({
      invoice: { WaterPart: { price: 150, sum: 0 } },
    })

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'WaterPart', 'sum'])).toBe(150)
    })
  })

  it('sets sum = 0 for undefined price', async () => {
    const { form } = renderWithForm({
      invoice: { WaterPart: { price: undefined, sum: 999 } },
    })

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'WaterPart', 'sum'])).toBe(0)
    })
  })

  it('sets sum = 0 for null price', async () => {
    const { form } = renderWithForm({
      invoice: { WaterPart: { price: null, sum: 10 } },
    })

    await waitFor(() => {
      expect(form.getFieldValue(['invoice', 'WaterPart', 'sum'])).toBe(0)
    })
  })
})
