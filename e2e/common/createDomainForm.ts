import { Page, expect } from '@playwright/test'
import { AppRoutes } from '@utils/constants'
import routeNavigator from './routerNavigation'

export const createDomainForm = (page: Page) => {
  const goto = routeNavigator(page)

  return {
    async openModal() {
      await goto(AppRoutes.DOMAIN)
      await page.getByRole('button', { name: 'Додати' }).click()
      await page.locator('.ant-modal-content').isVisible()
    },

    async fillForm() {
      await page.getByLabel('Назва').fill('e2e test domain')

      await page.getByLabel('Адміністратори').fill('globalAdmin@test.com')
      await page
        .locator('.ant-select-item', { hasText: 'globalAdmin@test.com' })
        .click()

      await page.getByLabel('Закріплені адреси').fill('e2e test street')
      await page.locator('.ant-select-item', { hasText: 'e2e test street' })

      await page.getByPlaceholder('Вкажіть ФОП').fill('e2e test FOP')
      await page.getByLabel('IBAN').fill('FR7630006000011234567890189')
      await page.getByLabel('РНОКПП').fill('e2e test РНОКПП')
      await page.getByLabel('МФО').fill('e2e test МФО')
    },

    async checkDescriptionField() {
      const descriptionField = page.getByLabel('Опис')
      await expect(descriptionField).toContainText(
        'e2e test FOP\nIBAN: FR7630006000011234567890189\nРНОКПП: e2e test РНОКПП\nМФО: e2e test МФО'
      )
    },

    async addClickButton() {
      await page.getByRole('button', { name: 'Додати', exact: true }).click()
    },

    async successCheck() {
      await expect(page.getByText('Додано')).toBeVisible()
      await expect(page.locator('.ant-modal-content')).not.toBeVisible()
    },
  }
}
