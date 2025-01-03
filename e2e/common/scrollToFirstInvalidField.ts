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
      await page.waitForTimeout(5000)

      await page.getByLabel('Надавач послуг').click()

      // await page.locator('.ant-select[aria-label="Надавач послуг"] .ant-select-selector').click();

      await page.locator('.ant-select-dropdown .ant-select-item').waitFor()

      await page.locator('.ant-select-item', { hasText: 'Pahan domen' }).click()

      await expect(
        page.locator(
          '.ant-select[aria-label="Надавач послуг"] .ant-select-selector'
        )
      ).toHaveText('Pahan domen')
    },

    clickSaveButton: async () => {
      await page.click('button:has-text("Зберегти")')
    },

    assertErrorDisplayed: async () => {
      const errorMessageLocator = page.locator('text=Не менше 0')
      await expect(errorMessageLocator).toBeVisible()

      const fieldWithError = page.locator(
        '#payments_0_invoice_electricityPrice_sum'
      )
      await expect(fieldWithError).toHaveClass(/ant-input-status-error/)

      await expect(fieldWithError).toBeInViewport()
    },
  }
}
