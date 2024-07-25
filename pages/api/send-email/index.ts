import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import Domain, { IDomain } from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import { IEmailModel } from '@common/api/emailApi/email.api.types'

const transporter = nodemailer.createTransport(
  {
    // service: 'gmail',
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 3000,
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  { from: process.env.EMAIL_FROM }
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET': {
      try {
        return res.status(200).json({ success: true, data: '' })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    }
    case 'POST': {
      try {
        const { companyId, domainId, ...body }: IEmailModel = req.body

        if (!domainId) {
          throw new Error('provider is not specified')
        }
        if (!companyId) {
          throw new Error('receiver is not specified')
        }

        const { isDomainAdmin, isGlobalAdmin, user } = await getCurrentUser(
          req,
          res
        )

        if (!isGlobalAdmin && !isDomainAdmin) {
          throw new Error('restricted access')
        }

        const domain: IDomain = await Domain.findById(domainId)
        if (!isGlobalAdmin && !domain) {
          throw new Error('unknown provider')
        }
        if (!isGlobalAdmin && !domain.adminEmails.includes(user.email)) {
          throw new Error('restricted access')
        }

        const company: IRealestate = await RealEstate.findById(companyId)
        if (!isGlobalAdmin && !company) {
          throw new Error('unknown receiver')
        }
        if (
          !isGlobalAdmin &&
          company.domain._id.toString() !== domain._id.toString()
        ) {
          throw new Error('restricted access')
        }

        const response = await transporter.sendMail(body)

        return res.status(201).json({ success: true, data: response })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    }
  }
}
