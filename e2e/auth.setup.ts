import { test as setup, expect } from '@playwright/test'

// const adminFile = 'playwright/.auth/admin.json'

// setup('authenticate as admin', async ({ page }) => {
//   // Perform authentication steps. Replace these actions with your own.
//   await page.goto('https://github.com/login')
//   await page.getByLabel('Username or email address').fill('admin')
//   await page.getByLabel('Password').fill('password')
//   await page.getByRole('button', { name: 'Sign in' }).click()
//   // Wait until the page receives the cookies.
//   //
//   // Sometimes login flow sets cookies in the process of several redirects.
//   // Wait for the final URL to ensure that the cookies are actually set.
//   await page.waitForURL('https://github.com/')
//   // Alternatively, you can wait until the page reaches a state where all cookies are set.
//   await expect(
//     page.getByRole('button', { name: 'View profile and more' })
//   ).toBeVisible()

//   // End of authentication steps.

//   await page.context().storageState({ path: adminFile })
// })

const userFile = 'playwright/.auth/user.json'

setup('authenticate as user', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('http://localhost:3000/auth/signin')

  const githubButton = page.locator('button[data-e2e="GitHub"]')

  // Assert that the button is visible
  await expect(githubButton).toBeVisible()

  // Click the button
  await githubButton.click()

  await page.getByLabel('Username or email address').fill('userEmail') //Github Account email here
  await page.getByLabel('Password').fill('userPassword') //Github Account password here

  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL('http://localhost:3000/')

  const eOrendaTitle = page.locator('h4:has-text("E-ORENDA")')

  // Assert that the element is visible
  await expect(eOrendaTitle).toBeVisible()

  // End of authentication steps.

  await page.context().storageState({ path: userFile })
})
