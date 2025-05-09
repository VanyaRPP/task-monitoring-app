import { Page } from '@playwright/test'
import { AppRoutes } from '@utils/constants'
import routeNavigator from './routerNavigation'

export const checkValuesForm = (page: Page) => {
  const goto = routeNavigator(page, AppRoutes)

  return {
    async openModal() {
      await goto(AppRoutes.PAYMENT)
      await page.getByRole('button', { name: 'Додати' }).click()
      await page.locator('.ant-modal-content').isVisible()
    },
    async selectDomain() {
      page.getByLabel('Надавач послуг').fill('Pahan domen')
      await page.waitForTimeout(1000)
      page
        .locator('.ant-select-item-option')
        .filter({ hasText: 'Pahan domen' })
        .first()
        .click()
    },
    async selectCompany() {
      page.getByLabel('Компанія').fill('New Pahan company')
      await page.waitForTimeout(3000)
      page
        .locator('.ant-select-item-option')
        .filter({ hasText: 'New Pahan company' })
        .first()
        .click()
    },
    async selectPaymentType() {
      await page
        .locator('.ant-select-selection-item', { hasText: 'Кредит (Оплата)' })
        .click()
      await page.waitForTimeout(3000)
      await page
        .locator('.ant-select-item-option', {
          hasText: 'Дебет (Реалізація)',
        })
        .click()
    },
    async checkValues() {
      const sumCells = await page
        .locator('td.ant-table-cell:nth-child(5)')
        .filter({ hasText: /грн/ })

      const cellCount = await sumCells.count()

      if (cellCount === 0) {
        // eslint-disable-next-line no-console
        console.error('Не знайдено жодних клітинок з "грн"')
      } else {
        for (let i = 0; i < cellCount; i++) {
          const cellText = await sumCells.nth(i).innerText()

          const numberText = cellText.replace('грн', '').trim()

          const numberValue = parseFloat(numberText)

          if (numberValue <= 0) {
            // eslint-disable-next-line no-console
            console.error(
              `Помилка: значення у клітинці ${
                i + 1
              } менше або дорівнює 0: ${numberValue}`
            )
          }
        }
      }
    },
  }
}
