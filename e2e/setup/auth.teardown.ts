import { test as teardown } from '@playwright/test'

teardown('clear domain admin json', async ({}) => {
  const fs = require('fs')
  const authFile = 'e2e/domainAdmin.json'

  fs.writeFileSync(authFile, JSON.stringify({}))
})

teardown('clear global admin json', async ({}) => {
  const fs = require('fs')
  const authFile = 'e2e/globalAdmin.json'

  fs.writeFileSync(authFile, JSON.stringify({}))
})
