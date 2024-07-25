import { Page, expect } from '@playwright/test'

export const customServiceForm = (page: Page) => {
  return {
    async openEditModalForCompany(companyName: string) {
      await expect(page).toHaveURL(/\/real-estate/)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('.ant-table-wrapper')).toBeVisible({
        timeout: 10000,
      })

      const row = page.locator('tr', { hasText: companyName })
      await expect(row).toBeVisible()

      const moreButton = row.locator('button >> svg[data-icon="more"]')
      await expect(moreButton).toBeVisible()
      await moreButton.click()

      const editMenuItem = page.getByRole('menuitem', { name: 'Редагувати' })
      await expect(editMenuItem).toBeVisible()
      await editMenuItem.click()

      const modal = page.locator('.ant-modal-content')
      await expect(modal).toBeVisible()
    },

    async addCustomService(serviceName: string) {
      const addButton = page.getByRole('button', {
        name: /Індивідуальні послуги/,
      })
      await expect(addButton).toBeVisible()
      await addButton.click()

      const serviceItem = page.getByRole('menuitem', { name: serviceName })
      await expect(serviceItem).toBeVisible()
      await serviceItem.click()

      const input = page.getByRole('spinbutton', {
        name: new RegExp(serviceName, 'i'),
      })
      await expect(input).toBeVisible()
    },

    async editCustomService(serviceName: string, newValue: string) {
      const input = page.getByRole('spinbutton', {
        name: new RegExp(serviceName, 'i'),
      })
      await expect(input).toBeVisible()
      await input.fill(newValue)
      await expect(input).toHaveValue(newValue)
    },

    async removeCustomService(serviceName: string) {
      const formItem = page.locator('.ant-form-item', { hasText: serviceName })
      await expect(formItem).toBeVisible({ timeout: 10000 })

      const deleteButton = page.getByTestId(`remove-${serviceName}`)
      const btnCount = await deleteButton.count()

      if (btnCount > 0) {
        await expect(deleteButton).toBeVisible({ timeout: 10000 })
        await deleteButton.click()
        await expect(formItem).toHaveCount(0)
      }
    },
  }
}
