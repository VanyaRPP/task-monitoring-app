/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { isValidEmail } from '@common/assets/features/validators'
import type { NextApiRequest, NextApiResponse } from 'next'
import EncryptionService from '@utils/encryptionService'
import { hidePercentCharacters } from '@utils/hidePercentCharacters/hidePercentCharacters'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

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

        await Domain.findByIdAndRemove(req.query.id).then((domain) => {
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

          const updatedObj = encryptDomainBankTokens(req.body, SECURE_TOKEN)
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
            { new: true }
          )
          return res.status(200).json({ success: true, data: response })
        } else {
          const updatedObj = encryptDomainBankTokens(req.body, SECURE_TOKEN)
          const response = await Domain.findOneAndUpdate(
            { _id: req.query.id },
            updatedObj,
            { new: true }
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
          const response = await Domain.findById({ _id: req.query.id })
          return res.status(200).json({ success: true, data: response })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
