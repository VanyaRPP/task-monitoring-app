/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { isValidEmail } from '@common/assets/features/validators'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  loadStoredBankTokens,
  prepareDomainBankTokens,
} from '@common/services/bankTokenService/bankToken.service'
import { normalizeDisabledServiceIds } from '@common/services/customServiceService/customService.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  // Turns the form's bank tokens into what is stored - see
  // prepareDomainBankTokens. Leaves the stored ones alone when none were sent.
  async function encryptDomainBankTokens(obj: any, domainId: string) {
    const prepared = Array.isArray(obj.domainBankToken)
      ? prepareDomainBankTokens(
          obj.domainBankToken,
          await loadStoredBankTokens(domainId)
        )
      : undefined
    if (prepared === undefined) {
      delete obj.domainBankToken
    } else {
      obj.domainBankToken = prepared
    }
    return obj
  }

  if (isUser) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'DELETE':
      try {
        if (!isAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'Access denied: not an admin' })
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const domain = await Domain.findOne({
            _id: req.query.id,
            adminEmails: user.email,
          })

          if (!domain) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied: domain not found or you are not an admin of this domain',
            })
          }
        }

        await Domain.findByIdAndDelete(req.query.id).then((domain) => {
          if (domain) {
            return res.status(200).json({
              success: true,
              data: 'Domain ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Domain ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error })
      }

    case 'PATCH':
      try {
        if (!isAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'Access denied: not an admin' })
        }

        if ('archived' in req.body) {
          delete req.body.archived
        }

        const disabledServiceIds = normalizeDisabledServiceIds(
          req.body?.disabledServiceIds
        )
        if (disabledServiceIds === undefined) {
          delete req.body.disabledServiceIds
        } else {
          req.body.disabledServiceIds = disabledServiceIds
        }

        const incomingEmails = req.body?.adminEmails
        if (incomingEmails !== undefined) {
          if (!Array.isArray(incomingEmails) || !isValidEmail(incomingEmails)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid email address in adminEmails',
            })
          }
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const domain = await Domain.findOne({
            _id: req.query.id,
            adminEmails: user.email,
          })

          if (!domain) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied: domain not found or you are not an admin of this domain',
            })
          }

          const updatedObj = await encryptDomainBankTokens(
            req.body,
            req.query.id as string
          )
          if (
            !updatedObj.adminEmails ||
            !Array.isArray(updatedObj.adminEmails)
          ) {
            updatedObj.adminEmails = []
          }
          if (!updatedObj.adminEmails.includes(user.email)) {
            updatedObj.adminEmails.push(user.email)
          }

          const response = await Domain.findOneAndUpdate(
            { _id: req.query.id },
            updatedObj,
            { returnDocument: 'after' }
          )
          return res.status(200).json({ success: true, data: response })
        } else {
          const updatedObj = await encryptDomainBankTokens(
            req.body,
            req.query.id as string
          )
          const response = await Domain.findOneAndUpdate(
            { _id: req.query.id },
            updatedObj,
            { returnDocument: 'after' }
          )
          return res.status(200).json({ success: true, data: response })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }

    case 'GET':
      try {
        if (isUser) {
          return res
            .status(403)
            .json({ success: false, message: 'Access denied' })
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const domain = await Domain.findOne({
            _id: req.query.id,
            adminEmails: user.email,
          })

          if (!domain) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied: domain not found or you are not an admin of this domain',
            })
          }

          return res.status(200).json({ success: true, data: domain })
        } else {
          const response = await Domain.findOne({ _id: req.query.id })
          return res.status(200).json({ success: true, data: response })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
