import { Page, expect } from '@playwright/test';
import { AppRoutes } from '@utils/constants';
import routeNavigator from './routerNavigation';

export const createPaymentForm = (page: Page) => {
  const goto = routeNavigator(page, AppRoutes);

  return {
    async openForm() {
      await goto(AppRoutes.PAYMENT);
      await page.getByRole('button', { name: 'Додати' }).click();
      await expect(page.locator('.ant-modal-content')).toBeVisible(); 
    },

    async selectServiceProvider(providerName: string) {
      const serviceProviderInput = page.getByLabel('Надавач послуг');
      await serviceProviderInput.fill('тест');
      const dropdownOption = page.locator('.ant-select-item-option').filter({ hasText: 'тест' }).first();
      await dropdownOption.waitFor({ state: 'visible' });
      await dropdownOption.click();
    },

    async selectPaymentType(paymentType: string) {

      const combobox = page.getByLabel('Тип оплати');
      await expect(combobox).toBeEnabled();
      await combobox.click();

      await page
        .locator('.ant-select-item', { hasText: paymentType })
        .click();
      await expect(page.locator('.ant-select-selection-item')).toHaveText(paymentType);
    },

    async fillPaymentDetails(invoiceNumber: string, amount?: string) {
      await expect(page.getByLabel('№ інвойса')).toBeVisible();
      await page.getByLabel('№ інвойса').fill(invoiceNumber);
      if (amount) {
        await page.getByLabel('Сума').fill(amount);
      }
    },

    async checkLogicForPaymentType(paymentType: string) {
      const selectedPaymentType = await page.locator('.ant-select-selection-item').innerText();

      if (selectedPaymentType === 'Кредит (Оплата)') {
        await expect(page.getByLabel('Сума')).toBeVisible();
        await page.getByLabel('Сума').fill('1000');
      } else if (selectedPaymentType === 'Дебет (Реалізація)') {
        await expect(page.getByLabel('Сума')).toBeEmpty();
      } else {
        throw new Error(`Непідтримуваний тип оплати: ${selectedPaymentType}`);
      }
    },

    async submitForm() {
      await page.getByRole('button', { name: 'Додати' }).click();
      await expect(page.locator('.ant-modal-content')).not.toBeVisible(); 
      await expect(page.getByText('Послугу успішно створено')).toBeVisible(); 
    },
  };
};