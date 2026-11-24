/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  isServiceErr,
  SERVICE_ERROR_STATUS,
  withDraftCompanyServices,
} from '@common/services/customServiceService/customService.service'
import type { NextApiRequest, NextApiResponse } from 'next'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { user, isGlobalAdmin, isDomainAdmin, isUser, isAdmin } =
    await getCurrentUser(req, res)
  const ctx = { user, isGlobalAdmin, isDomainAdmin, isUser }

  const updateWithDraftServices = async (body, domainId) => {
    const result = await withDraftCompanyServices(body, domainId, ctx, (b) =>
      RealEstate.findOneAndUpdate({ _id: req.query.id }, b, {
        returnDocument: 'after',
      })
    )
    if (isServiceErr(result)) {
      return res
        .status(SERVICE_ERROR_STATUS[result.code])
        .json({ success: false, message: result.message })
    }
    return res.status(200).json({ success: true, data: result.data })
  }

  switch (req.method) {
    case 'DELETE':
      try {
        if (isGlobalAdmin) {
          const realEstate = await RealEstate.findByIdAndDelete(req.query.id)
          if (realEstate) {
            return res.status(200).json({
              success: true,
              data: 'realestate ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(404).json({
              success: false,
              message: 'realestate not found',
            })
          }
        }

        if (isAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const adminDomainIds = adminDomains?.map((d) => d._id.toString())

          const currentRealEstate = await RealEstate.findById(req.query.id)

          if (!currentRealEstate) {
            return res.status(404).json({
              success: false,
              message: 'realestate not found',
            })
          }

          const currentDomainId = currentRealEstate.domain?.toString()

          if (!currentDomainId || !adminDomainIds?.includes(currentDomainId)) {
            return res.status(403).json({
              success: false,
              message: 'not allowed',
            })
          }

          await RealEstate.findByIdAndDelete(req.query.id)
          return res.status(200).json({
            success: true,
            data: 'realestate ' + req.query.id + ' was deleted',
          })
        }

        return res.status(403).json({ success: false, message: 'not allowed' })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }

    case 'PATCH':
      try {
        if (isAdmin) {
          if (isGlobalAdmin) {
            const bodyDomain = req.body.domain
            const targetDomainId =
              (typeof bodyDomain === 'string'
                ? bodyDomain
                : bodyDomain?._id?.toString?.()) ||
              (
                await RealEstate.findById(req.query.id).select('domain')
              )?.domain?.toString()
            return await updateWithDraftServices(req.body, targetDomainId)
          } else {
            const adminDomains = await Domain.find({
              adminEmails: { $in: [user.email] },
            })
            const adminDomainIds = adminDomains?.map((d) => d._id.toString())

            const currentRealEstate = await RealEstate.findById(req.query.id)
            if (!currentRealEstate) {
              return res
                .status(404)
                .json({ success: false, message: 'realestate not found' })
            }
            const currentDomainId = currentRealEstate.domain?.toString()
            if (
              !currentDomainId ||
              !adminDomainIds?.includes(currentDomainId)
            ) {
              return res
                .status(400)
                .json({ success: false, message: 'not allowed' })
            }

            const rawNewDomain = req.body.domain
            const isRelocation =
              rawNewDomain !== undefined && rawNewDomain !== null

            if (isRelocation) {
              const newDomainId =
                typeof rawNewDomain === 'string'
                  ? rawNewDomain
                  : rawNewDomain?._id?.toString?.()
              if (!newDomainId || !adminDomainIds.includes(newDomainId)) {
                return res
                  .status(400)
                  .json({ success: false, message: 'not allowed' })
              }

              return await updateWithDraftServices(
                { ...req.body, domain: newDomainId },
                newDomainId
              )
            }

            const { domain, ...bodyWithoutDomain } = req.body
            return await updateWithDraftServices(
              bodyWithoutDomain,
              currentDomainId
            )
          }
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
