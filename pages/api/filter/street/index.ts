/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getStreetsPipeline } from '@utils/pipelines'
import { getDistinctStreets, getFilterForAddress } from '@utils/helpers'
import RealEstate from '@modules/models/RealEstate'
import { IStreet } from '@modules/models/Street'
import mongoose from 'mongoose'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await start()

  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { realEstates, domains } = req.query
      const filteredCompanys =
        realEstates !== undefined && realEstates !== 'null'
          ? realEstates.split(',').map((id) => new mongoose.Types.ObjectId(id))
          : null

      const filteredDomains =
        domains !== undefined && domains !== 'null'
          ? domains.split(',').map((id) => new mongoose.Types.ObjectId(id))
          : null

      const distinctStreets = await getDistinctStreets({
        user,
        model: RealEstate,
        filters: { filteredCompanys, filteredDomains },
      })

      const streetsFilter = distinctStreets

        ?.map((street) => street.streetData as IStreet)
        .filter(
          (street, index, streets) =>
            index ===
            streets.findIndex((s) => s._id.toString() === street._id.toString())
        )
        .map((street) => ({
          text: `${street.address}, м.${street.city}`,
          value: street._id,
        }))

      return res.status(200).json({ streetsFilter, success: true })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }
}
