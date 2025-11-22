import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { Sum } from './index';
import { describe, it, expect } from '@jest/globals';

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    service: {},
    payment: {},
  }),
}))

describe('WaterPart.Sum', () => {
    it('correct sum with numeric price', async () => {
        const [form] = Form.useForm();

        form.setFieldsValue({
            invoice: {
                WaterPart: {
                    price: 150,
                    sum: 0,
                },
            },
        });

        render(<Sum form={form} name={['WaterPart']} />);

        await waitFor(() => {
            expect(form.getFieldValue(['invoice', 'WaterPart', 'sum'])).toBe(150);
        });

        expect(screen.getByText('150.00 грн')).toBeDefined();
    });

    it('sets sum = 0 for undefined price', async () => {
        const [form] = Form.useForm();

        form.setFieldsValue({
            invoice: {
                WaterPart: {
                    price: undefined,
                    sum: 999,
                },
            },
        })

        render(<Sum form={form} name={['WaterPart']} />)

        await waitFor(() => {
            const sum = form.getFieldValue(['invoice', 'WaterPart', 'sum'])
            expect(sum).toBe(0)
        })
        

        expect(screen.getByText('0.00 грн')).toBeDefined()
    })

    it('sets sum = 0 for null price', async () => {
        const [form] = Form.useForm();

        form.setFieldsValue({
            invoice: {
                WaterPart: {
                    price: null,
                    sum: 10,
                },
            },
        })

        render(<Sum form={form} name={['WaterPart']} />)


        await waitFor(() => {
            const sum = form.getFieldValue(['invoice', 'WaterPart', 'sum'])
            expect(sum).toBe(0)
        })

        expect(screen.getByText('0.00 грн')).toBeDefined()
    })
})