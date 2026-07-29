/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import EncryptionService from '@utils/encryptionService'
import { hidePercentCharacters } from '@utils/hidePercentCharacters/hidePercentCharacters'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

  function encryptDomainBankTokens(obj: any, secretKey: string) {
    if (!obj.domainBankToken || !Array.isArray(obj.domainBankToken)) {
      return obj
    }

    const encryptionService = new EncryptionService(secretKey)

    obj.domainBankToken = obj.domainBankToken.map((item) => ({
      ...item,
      token: item.token || encryptionService.encrypt(item.shortToken),
      shortToken: hidePercentCharacters(item.shortToken),
    }))

    return obj
  }

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0, domainId = [], streetId = [], archived } = req.query

        const domainIds = typeof domainId === 'string' ? [domainId] : domainId
        const streetIds = typeof streetId === 'string' ? [streetId] : streetId
        const options: any = {}

        if (!isDomainAdmin && !isGlobalAdmin && !isUser) {
          return res.status(200).json({ success: true, data: [] })
        }

        const isArchived = archived ? archived === 'true' : undefined

        if (isUser) {
          const userRealEstates = await RealEstate.find(
            { adminEmails: user.email },
            { domain: 1 }
          ).lean()
          const domainIds = [
            ...new Set(
              userRealEstates.map((re) => re.domain?.toString()).filter(Boolean)
            ),
          ]
          const userDomainFilter: any = { _id: { $in: domainIds } }
          if (isArchived === true) {
            userDomainFilter.archived = true
          } else if (isArchived === false) {
            userDomainFilter.archived = { $ne: true }
          }
          const domains = await Domain.find(userDomainFilter)
            .limit(+limit)
            .populate('streets')
          return res.status(200).json({ success: true, data: domains })
        }

        if (isArchived === true) {
          options.archived = true
        } else if (isArchived === false) {
          // legacy domains created before the archive feature have no
          // `archived` field, so `$ne: true` matches false + missing + null
          options.archived = { $ne: true }
        }

        if (isDomainAdmin) {
          options.adminEmails = user.email

          if (domainIds?.length > 0) {
            options._id = { $in: domainIds }
          }

          if (streetIds?.length > 0) {
            options.streets = streetIds
          }
        } else {
          if (domainIds?.length > 0) {
            options._id = { $in: domainIds }
          }

          if (streetIds?.length > 0) {
            options.streets = streetIds
          }
        }

        const domains = await Domain.find(options)
          .limit(+limit)
          .populate('streets')

        return res.status(200).json({ success: true, data: domains })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
        // Any authenticated user may create a domain. Creating one makes them
        // its admin (their email is added to adminEmails below), which promotes
        // them to DomainAdmin on the next request via getCurrentUser.
        const { name, streets } = req.body

        const existingDomain = await Domain.findOne({
          name,
          streets: { $all: streets },
        })
        if (existingDomain) {
          return res
            .status(400)
            .json({ success: false, error: 'Домен з такими даними вже існує' })
        }

        const updatedObj = encryptDomainBankTokens(req.body, SECURE_TOKEN)
        delete updatedObj.archived
        if (!isGlobalAdmin) {
          if (
            !updatedObj.adminEmails ||
            !Array.isArray(updatedObj.adminEmails)
          ) {
            updatedObj.adminEmails = []
          }
          if (!updatedObj.adminEmails.includes(user.email)) {
            updatedObj.adminEmails.push(user.email)
          }
        }

        await Domain.create(updatedObj)
          .then((domain) => {
            return res.status(201).json({ success: true, data: domain })
          })
          .catch((error) => {
            throw error
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
