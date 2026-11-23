import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import { BankTokenErrorCode, getDomainBankToken } from './bankToken.service'

const STATUS: Record<BankTokenErrorCode, number> = {
  invalid: 400,
  forbidden: 403,
  not_found: 404,
}

export interface DomainBankContext {
  /** Decrypted PrivatBank token. Use it for the bank call only - never respond with it. */
  token: string
  domainId: string
  access: Awaited<ReturnType<typeof getCurrentUser>>
}

/**
 * Wraps a /api/bankapi route: GET only, signed-in admins of `?domainId=`
 * only, and the handler receives that domain's token decrypted on the server.
 *
 * The browser used to decrypt the token itself and send it back in a `token`
 * header, which let anyone holding a token use these routes as a proxy to the
 * bank. Tokens from the request are no longer read at all.
 */
export function withDomainBankToken(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<Data>,
    context: DomainBankContext
  ) => Promise<unknown>
) {
  return async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    if (req.method !== 'GET') {
      return res
        .status(405)
        .json({ success: false, message: `Method ${req.method} not allowed` })
    }

    await start()

    let access: DomainBankContext['access']
    try {
      access = await getCurrentUser(req, res)
    } catch {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    try {
      const result = await getDomainBankToken(access, req.query.domainId)
      if (result.ok === false) {
        return res
          .status(STATUS[result.code])
          .json({ success: false, message: result.message })
      }

      return await handler(req, res, {
        token: result.token,
        domainId: req.query.domainId as string,
        access,
      })
    } catch (error) {
      // Name only: the message of an unexpected error is not ours to vet.
      console.error(
        'bank API: request failed',
        error instanceof Error ? error.name : typeof error
      )
      if (!res.writableEnded) {
        return res.status(500).json({
          success: false,
          message: 'Не вдалося виконати запит до банку',
        })
      }
    }
  }
}
