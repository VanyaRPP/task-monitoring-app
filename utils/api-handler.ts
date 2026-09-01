import start, { Data } from '@pages/api/api.config'
import type { NextApiRequest, NextApiResponse } from 'next'

export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse<Data>) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    try {
      // Every request, not once per container: a Lambda instance whose only
      // dial failed would otherwise serve 500s for the rest of its life.
      await start()
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
