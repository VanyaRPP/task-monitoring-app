import { expect, Page } from '@playwright/test'
import routeNavigator from './routerNavigation'
import { AppRoutes } from '@utils/constants'

export const scrollToFirstInvalidField = (page: Page) => {
  const goto = routeNavigator(page, AppRoutes)

  return {
    openForm: async () => {
      await goto(AppRoutes.PAYMENT_BULK)
    },

    fillForm: async () => {
      await page.getByLabel('Надавач послуг').click()

      await page.locator('.ant-select-item', { hasText: 'Pahan domen' }).click();

      await page.locator('input#payments_0_invoice_electricityPrice_amount').fill('-100');
    },

    assertErrorDisplayed: async () => {
      await expect(page.locator('#payments_0_invoice_electricityPrice_amount')).toBeInViewport()
    },

    clickSaveButton: async () => {
      await page.click('button:has-text("Зберегти")')
    },
  }
}
