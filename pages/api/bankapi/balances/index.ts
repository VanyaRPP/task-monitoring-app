/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { withDomainBankToken } from '@common/services/bankTokenService/withDomainBankToken'
import { getFinalBalances } from './utils/getBalances/index'

// `?domainId=` picks the domain; its token is decrypted on the server.
export default withDomainBankToken(async (req, res, { token }) => {
  try {
    const data = await getFinalBalances(token)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(409).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    })
  }
})
