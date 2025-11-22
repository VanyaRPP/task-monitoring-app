import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { Form} from 'antd';
import { Sum } from './index';
import { describe, it, expect } from '@jest/globals';

jest.mock('@components/AddPaymentModal', () => ({
  usePaymentContext: () => ({
    prevService: {},
    prevPayment: {},
    company: {},
  }),
}));

describe('Inflicion.Sum', () => {
    it('correct sum with numeric price', async () => {
        const [form] = Form.useForm();

        form.setFieldsValue({
            invoice: {
                Inflicion: {
                    price: 200,
                    sum: 0,
                },
            },
        });

        render(<Sum form={form} name={['Inflicion']} />);

        await waitFor(() => {
            expect(form.getFieldValue(['invoice', 'Inflicion', 'sum'])).toBe(200);
        });

        expect(screen.getByText('200.00 грн')).toBeDefined();
    });

    it('sets sum = 0 for undefined price', async () => {
        const [form] = Form.useForm();

        form.setFieldsValue({
            invoice: {
                Inflicion: {
                    price: undefined,
                    sum: 999,
                },
            },
        });

        render(<Sum form={form} name={['Inflicion']} />);

        await waitFor(() => {
            const sum = form.getFieldValue(['invoice', 'Inflicion', 'sum']);
            expect(sum).toBe(0);
        });

        expect(screen.getByText('0.00 грн')).toBeDefined();
    });

    it('sets sum = 0 for null price', async () => {
        const [form] = Form.useForm();

        form.setFieldsValue({
            invoice: {
                Inflicion: {
                    price: null,
                    sum: 10,
                },
            },
        });

        render(<Sum form={form} name={['Inflicion']} />);

        await waitFor(() => {
            const sum = form.getFieldValue(['invoice', 'Inflicion', 'sum']);
            expect(sum).toBe(0);
        });

        expect(screen.getByText('0.00 грн')).toBeDefined();
    });
  });