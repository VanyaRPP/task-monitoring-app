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
    it('коректно розраховує суму при числовому значенні price', async () => {
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

    it('встановлює sum = 0 при undefined значенні price', async () => {
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

    it('ставить sum = 0 при null значенні price', async () => {
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