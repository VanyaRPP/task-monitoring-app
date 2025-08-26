import { test, expect } from '@playwright/test'
import { customServiceForm } from '../common/customServiceForm'

test.use({ storageState: 'e2e/globalAdmin.json' })

let form: ReturnType<typeof customServiceForm>

test.beforeEach(async ({ page }) => {
  form = customServiceForm(page)

  await page.goto('http://localhost:3000/en/real-estate')
  await page.waitForLoadState('networkidle')

  await form.openEditModalForCompany('Van company')
})

test('додавання індивідуальної послуги', async () => {
  await form.addCustomService('Інфляція')
})

test('редагування індивідуальної послуги', async () => {

  await form.addCustomService('Інфляція')
  await form.editCustomService('Інфляція', '123')
})

test('видалення індивідуальної послуги', async () => {

  await form.addCustomService('Інфляція')
  await form.removeCustomService('Інфляція')
})
