import { Page, expect } from '@playwright/test'
import { AppRoutes } from '@utils/constants'
import routeNavigator from './routerNavigation'
import { waitFor } from '@testing-library/dom'

export const createPaymentForm = (page: Page) => {
  const goto = routeNavigator(page, AppRoutes)

  return {
    async openForm() {
      await goto(AppRoutes.PAYMENT)
      await page.getByRole('button', { name: 'Додати' }).click()
      await expect(page.locator('.ant-modal-content')).toBeVisible()
    },

    async selectDomain(providerName: string) {
      const serviceProviderInput = page.getByLabel('Надавач послуг')
      await serviceProviderInput.fill('тест')
      const dropdownOption = page
        .locator('.ant-select-item-option')
        .filter({ hasText: 'тест' })
        .first()
      await dropdownOption.waitFor({ state: 'visible' })
      await dropdownOption.click()
      await page.waitForTimeout(10000);
    },
    async checkFillInputs(){
      const items = page.locator('.ant-select-selection-item');
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        await expect(item).not.toHaveText('');
        console.log(i)
      }
    },

    async selectPaymentType(paymentType: string) {
      const combobox = page.locator('.ant-form-item-required', {hasText: 'Тип оплати'})
      await expect(combobox).toBeEnabled()
      await combobox.click()

    },

    async fillPaymentDetails(invoiceNumber: string, amount?: string) {
      await expect(page.getByLabel('№ інвойса')).toBeVisible()
      await page.getByLabel('№ інвойса').fill(invoiceNumber)
      if (amount) {
        await page.getByLabel('Сума').fill(amount)
      }
      await page.getByLabel('Опис').fill('тест');
    },

    async checkLogicForPaymentType(paymentType: string) {
      const selectedPaymentType = await page.locator("")
        .locator('.ant-select-selection-item')
        .innerText()

      if (selectedPaymentType === 'Кредит (Оплата)') {
        await expect(page.getByLabel('Сума')).toBeVisible()
        await page.getByLabel('Сума').fill('1000')
      } else if (selectedPaymentType === 'Дебет (Реалізація)') {
        await expect(page.getByLabel('Сума')).toBeEmpty()
      } else {
        throw new Error(`Непідтримуваний тип оплати: ${selectedPaymentType}`)
      }
    },

    async submitForm() {
      await page.locator('.ant-btn-primary').click()
      await expect(page.locator('.ant-modal-content')).not.toBeVisible()
    },
  }
}
