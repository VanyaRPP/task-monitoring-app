import { test } from '@playwright/test'
import { scrollToFirstInvalidField } from '../common/scrollToFirstInvalidField'

test.describe('Payment Form Validation', () => {
  test.use({ storageState: 'e2e/domainAdmin.json' })

  test('should scroll to the first invalid field and display an error', async ({
    page,
  }) => {
    const formHelper = scrollToFirstInvalidField(page)

    await formHelper.openForm()

    await formHelper.fillForm()

    await formHelper.clickSaveButton()

    await formHelper.assertErrorDisplayed()
  })
})
