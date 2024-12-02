import { Page } from '@playwright/test'
import { AppRoutes } from '@utils/constants'

function routeNavigator(page: Page) {
  return async function navigateTo(route: string) {
    return await page.goto(route)
  }
}

export default routeNavigator
