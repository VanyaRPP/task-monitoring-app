/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
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
  const { isGlobalAdmin, isAdmin } = await getCurrentUser(req, res)

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

  function encryptDomainBankTokens(obj: any, secretKey: string) {
    const encryptionService = new EncryptionService(secretKey)

    // Use map to replace each token with its encrypted version
    obj.domainBankToken = obj.domainBankToken.map(
      (item: { name: string; token: string; shortToken?: string }) => ({
        ...item,
        token: item.token || encryptionService.encrypt(item.shortToken),
        shortToken: hidePercentCharacters(item.shortToken),
      })
    )

    return obj
  }

  if (!isAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'DELETE':
      try {
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
        if (isAdmin) {
          const updatedObj = encryptDomainBankTokens(req.body, SECURE_TOKEN)
          const response = await Domain.findOneAndUpdate(
            { _id: req.query.id },
            req.body,
            { new: true }
          )
          return res.status(200).json({ success: true, data: response })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }

    case 'GET':
      try {
        if (isGlobalAdmin) {
          const response = await Domain.findById({ _id: req.query.id })
          return res.status(200).json({ success: true, data: response })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
