import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import {
  formatSyncReport,
  hasProblems,
  syncInflationIndexes,
} from '@utils/inflation-index/sync'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { maxDuration: 60 }

async function monthlyHandler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }

  const report = await syncInflationIndexes()
  const problems = hasProblems(report)

  const log = problems ? console.error : console.warn
  log(formatSyncReport(report))

  return res
    .status(200)
    .json({ success: true, data: { ...report, hasProblems: problems } })
}

export default withErrorHandler(monthlyHandler)
