import { test } from '@playwright/test'
import { editStreetForm } from 'e2e/common/editStreetForm'

test.describe('Edit Street', () => {
  test.use({ storageState: 'e2e/globalAdmin.json' })

  test('edit street e2e', async ({ page }) => {
    const editSFormHelper = editStreetForm(page)
    await editSFormHelper.openURL()
    await editSFormHelper.editStreetE2E()
  })

  test('edit streets', async ({ page }) => {
    test.setTimeout(600)

    const editSFormHelper = editStreetForm(page)
    await editSFormHelper.openURL()
    await editSFormHelper.editAllStreets()
  })
})
