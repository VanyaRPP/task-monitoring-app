import { test, expect } from '@playwright/test'
import { checkValuesForm } from 'e2e/common/checkValuesForm'

test.describe('Payment Form Tests', () => {
  test.use({ storageState: 'e2e/globalAdmin.json' })

  test('check is all invoices have sum > 0', async ({ page }) => {
    const valuesFormHelper = checkValuesForm(page)

    await valuesFormHelper.openModal()
    await valuesFormHelper.selectDomain()
    await valuesFormHelper.selectCompany()
    await valuesFormHelper.selectPaymentType()
    await valuesFormHelper.checkValues()
  })
})
