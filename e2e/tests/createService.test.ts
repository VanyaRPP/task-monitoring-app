// e2e/tests/createService.tests.ts
import { createServiceForm } from 'e2e/common/createServiceForm'
import { test } from '@playwright/test'

test.describe('creating service', () => {
  test.use({ storageState: 'e2e/globalAdmin.json' })

  test('create service', async ({ page }) => {
    const serviceFormHelper = createServiceForm(page)

    await serviceFormHelper.openModal()
    await serviceFormHelper.fillForm()
    await serviceFormHelper.submitForm()
    await serviceFormHelper.successCheck()
  })
})
