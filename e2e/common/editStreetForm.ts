import { Page, expect } from '@playwright/test'
import { AppRoutes } from '@utils/constants'
import routeNavigator from './routerNavigation'

export const editStreetForm = (page: Page) => {
  const goto = routeNavigator(page, AppRoutes)

  return {
    async openURL() {
      await goto(AppRoutes.STREETS)
      await expect(page).toHaveURL(AppRoutes.STREETS)
    },

    async editStreetE2E() {
      const row = page.locator('tr[data-row-key="677e1768eff97b571b52849a"]')

      const editButton = row.locator('span[aria-label="edit"]')

      await expect(editButton).toBeVisible()

      await editButton.click()

      const modal = page.locator('.ant-modal-content')
      await expect(modal).toBeVisible()

      const saveButton = modal.locator('button.ant-btn-primary')
      await expect(saveButton).toBeVisible()
      await saveButton.click()

      await expect(modal).not.toBeVisible()

      const successMessage = page.locator(
        'span:has-text("Адресу успішно оновлено")'
      )
      await expect(successMessage).toBeVisible()
    },

    async editAllStreets() {
      const rows = page.locator('tr[data-row-key]')
      for (let i = 0; i < (await rows.count()); i++) {
        const row = rows.nth(i)

        const editButton = row.locator('span[aria-label="edit"]')
        await expect(editButton).toBeVisible()

        await editButton.click()

        const modal = page.locator('.ant-modal-content')
        await expect(modal).toBeVisible()

        const saveButton = modal.locator('button.ant-btn-primary')
        await expect(saveButton).toBeVisible()
        await saveButton.click()

        await expect(modal).not.toBeVisible()
      }
    },
  }
}
