import { test } from '@playwright/test';
import { createPaymentForm } from 'e2e/common/createPaymentForm';

test.describe('Payment Form Tests', () => {
  test.use({ storageState: 'e2e/globalAdmin.json' });

  test('Create payment with "Кредит (Оплата)"', async ({ page }) => {
    const paymentFormHelper = createPaymentForm(page);

    await paymentFormHelper.openForm();
    await paymentFormHelper.selectServiceProvider('тест');
    await paymentFormHelper.selectPaymentType('Кредит (Оплата)');
    await paymentFormHelper.fillPaymentDetails('330',  '1000');
    await paymentFormHelper.submitForm();
  });

  test('Create payment with "Дебет (Реалізація)"', async ({ page }) => {
    const paymentFormHelper = createPaymentForm(page);

    await paymentFormHelper.openForm();
    await paymentFormHelper.selectServiceProvider('тест');
    await paymentFormHelper.selectPaymentType('Дебет (Реалізація)');
    await paymentFormHelper.fillPaymentDetails('330', '09.12.2024'); 
    await paymentFormHelper.submitForm();
  });
});