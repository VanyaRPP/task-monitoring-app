import type { Data } from '@pages/api/api.config'
import type { NextApiRequest, NextApiResponse } from 'next'

export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse<Data>) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    try {
      await handler(req, res)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Internal server error'
      console.error('API handler error', error)
      if (!res.writableEnded) {
        res.status(500).json({ success: false, message })
      }
    }
  }
}
