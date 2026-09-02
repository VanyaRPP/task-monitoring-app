/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { user, isGlobalAdmin, isAdmin } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'DELETE':
      try {
        if (isGlobalAdmin) {
          const realEstate = await RealEstate.findByIdAndRemove(req.query.id)
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

          await RealEstate.findByIdAndRemove(req.query.id)
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
            const response = await RealEstate.findOneAndUpdate(
              { _id: req.query.id },
              req.body,
              { new: true }
            )
            return res.status(200).json({ success: true, data: response })
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

              const response = await RealEstate.findOneAndUpdate(
                { _id: req.query.id },
                { ...req.body, domain: newDomainId },
                { new: true }
              )
              return res.status(200).json({ success: true, data: response })
            }

            const { domain, ...bodyWithoutDomain } = req.body
            const response = await RealEstate.findOneAndUpdate(
              { _id: req.query.id },
              bodyWithoutDomain,
              { new: true }
            )
            return res.status(200).json({ success: true, data: response })
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
