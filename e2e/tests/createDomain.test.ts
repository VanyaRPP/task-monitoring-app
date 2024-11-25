import { createDomainForm } from 'e2e/common/createDomainForm'
import { test } from 'playwright/test'

test.describe('creating domain', () => {
  test.use({ storageState: 'e2e/globalAdmin.json' })

  test('create domain', async ({ page }) => {
    const createFormHelper = createDomainForm(page)

    await createFormHelper.openModal()
    await createFormHelper.fillForm()
    await createFormHelper.checkDescriptionField()
    await createFormHelper.addClickButton()
    await createFormHelper.successCheck()
  })
})
