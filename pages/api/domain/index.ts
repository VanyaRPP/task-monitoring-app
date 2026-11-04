/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  prepareDomainBankTokens,
  withoutBankTokenSecrets,
} from '@common/services/bankTokenService/bankToken.service'
import { DOMAIN_GENERAL_PROJECTION } from '@utils/domain/domain-view-access'
import { normalizeDisabledServiceIds } from '@common/services/customServiceService/customService.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  // A new domain has no stored tokens, so every entry is a token typed into
  // the form; any `token` the client sends is ignored.
  function encryptDomainBankTokens(obj: any) {
    const prepared = prepareDomainBankTokens(obj.domainBankToken, [])
    if (prepared === undefined) {
      delete obj.domainBankToken
    } else {
      obj.domainBankToken = prepared
    }
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
          // View-only access: a plain User may preview the provider their
          // companies belong to, so they get exactly what the «Загальне» tab
          // renders and nothing else. Admin-only material (bank tokens,
          // service/template configuration, archive flags) is projected away
          // here, on the server, so it is unreachable even by calling the API
          // directly.
          const domains = await Domain.find(userDomainFilter)
            .select(DOMAIN_GENERAL_PROJECTION)
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

        const updatedObj = encryptDomainBankTokens(req.body)
        delete updatedObj.archived
        updatedObj.disabledServiceIds =
          normalizeDisabledServiceIds(updatedObj.disabledServiceIds) ?? []
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
            // `create` hands back the document as written, encrypted token
            // included - select: false only applies to queries.
            return res.status(201).json({
              success: true,
              data: withoutBankTokenSecrets(
                typeof domain?.toObject === 'function'
                  ? domain.toObject()
                  : domain
              ),
            })
          })
          .catch((error) => {
            throw error
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
