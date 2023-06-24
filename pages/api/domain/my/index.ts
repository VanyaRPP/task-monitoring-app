/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import start, { Data } from 'pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import Domain from '@common/modules/models/Domain'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  if (!isGlobalAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'GET':
      try {
        const domains = await Domain.find({}) // Find all domains

        // Extract adminEmails and their respective domain names
        const allAdminEmails = domains.reduce((emails, domain) => {
          if (domain.adminEmails && domain.adminEmails.length > 0) {
            const adminEmails = domain.adminEmails.map((email) => ({
              email,
              domainName: domain.name,
            }))
            return emails.concat(adminEmails)
          }
          return emails
        }, [])

        return res.status(200).json({ success: true, data: allAdminEmails })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    default:
      return res
        .status(405)
        .json({ success: false, message: 'Method Not Allowed' })
  }
}
