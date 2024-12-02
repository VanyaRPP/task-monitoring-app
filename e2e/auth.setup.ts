import { test as setup } from '@playwright/test'

setup('authenticate as global admin', async ({ page }) => {
  const authFile = 'e2e/globalAdmin.json'

  await page.goto('https://dev.d3lib7r0j7pety.amplifyapp.com/auth/signin')

  await page.locator('[data-e2e="authFormEmail"]').fill('globalAdmin@test.com')
  await page.locator('[data-e2e="authFormPassword"]').fill('testGlobalAdmin123')
  await page.getByRole('button', { name: 'Вхід', exact: true }).click()

  await page.waitForTimeout(3000)

  await page.context().storageState({ path: authFile })
})

setup('authenticate as domain admin', async ({ page }) => {
  const authFile = 'e2e/domainAdmin.json'

  await page.goto('https://dev.d3lib7r0j7pety.amplifyapp.com/auth/signin')

  await page.locator('[data-e2e="authFormEmail"]').fill('domainAdmin@test.com')
  await page.locator('[data-e2e="authFormPassword"]').fill('testDomainAdmin123')
  await page.getByRole('button', { name: 'Вхід', exact: true }).click()

  await page.waitForTimeout(3000)

  await page.context().storageState({ path: authFile })
})
