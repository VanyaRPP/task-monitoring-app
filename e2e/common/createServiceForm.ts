// e2e/common/createServiceForm.ts
import { Page, expect } from '@playwright/test'
import { AppRoutes } from '@utils/constants'
import routeNavigator from './routerNavigation'

export const createServiceForm = (page: Page) => {
  const goto = routeNavigator(page, AppRoutes)

  return {
    async openModal() {
      await goto(AppRoutes.SERVICE) // Навігація на сторінку послуг
      await page.getByRole('button', { name: 'Додати' }).click()
      await page.locator('.ant-modal-content').isVisible()
    },

    async fillForm() {
      await page.getByLabel('Надавач послуг').fill('123qwe')
      await page.locator('.ant-select-item', { hasText: '123qwe' }).click();

      await page.getByLabel('Місяць та рік').click();
      await page.locator('.ant-picker-cell', { hasText: 'Січ' }).click();

      await page.getByLabel('Утримання приміщень (грн/м²)').fill('10');
      await page.getByLabel('Електроенергія (грн/кВт)').fill('20');
      await page.locator('#waterPrice').fill('15');
      await page.getByLabel('Всього водопостачання (грн/м³)').fill('25');
      await page.getByLabel('Вивіз сміття').fill('5');
      await page.locator('#inflicionPrice').fill('5');

      await page.getByLabel('Опис').fill('тест');
    },


    async submitForm() {
      await page.getByRole('button', { name: 'Додати', exact: true }).click()
    },

    async successCheck() {
      await expect(page.locator('.ant-modal-content')).not.toBeVisible()
    },
  }
}
