import { test } from '@playwright/test'

test.describe(() => {
  test.use({ storageState: 'playwright/.auth/user.json' })

  test('user test', async ({ page }) => {
    await page.goto('http://localhost:3000/payment')
  })
})
