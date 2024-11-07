/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import start from '@pages/api/api.config'
import { getStreetsPipeline } from '@utils/pipelines'
import { getDistinctCompanyAndDomain } from '@utils/helpers'
import { quarters } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import { getFilterForAddress } from '@utils/helpers'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isUser, isDomainAdmin, isGlobalAdmin, isAdmin, user } =
    await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { streetIds, companyIds, domainIds, limit, skip, type } = req.query

      const companiesIds: string[] | null = companyIds
        ? typeof companyIds === 'string'
          ? companyIds.split(',').map((id) => decodeURIComponent(id))
          : companyIds.map((id) => decodeURIComponent(id))
        : null
      const streetsIds: string[] | null = streetIds
        ? typeof streetIds === 'string'
          ? streetIds.split(',').map((id) => decodeURIComponent(id))
          : streetIds.map((id) => decodeURIComponent(id))
        : null
      const domainsIds: string[] | null = domainIds
        ? typeof domainIds === 'string'
          ? domainIds.split(',').map((id) => decodeURIComponent(id))
          : domainIds.map((id) => decodeURIComponent(id))
        : null
      const options: FilterQuery<typeof Payment> = {}

      if (isGlobalAdmin) {
        if (companiesIds) {
          options.company = { $in: companiesIds }
        }
        if (streetsIds) {
          options.street = { $in: streetIds }
        }
        if (domainsIds) {
          options.domain = { $in: domainsIds }
        }
      } else if (isDomainAdmin) {
        const relatedDomainsIds = (
          await Domain.find({
            adminEmails: user.email,
          })
        ).map((domain) => domain._id.toString())

        if (streetsIds) {
          options.street = { $in: streetIds }
        }

        const domains = await Domain.find({
          ...(domainsIds ? { _id: { $in: domainsIds } } : {}),
          adminEmails: user.email,
        })

        options.domain = {
          $in: domains.map(({ _id }) => _id.toString()),
        }
      } else if (isUser) {
        const companies = await RealEstate.find({
          ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
          adminEmails: user.email,
          ...(domainIds ? { domain: { $in: domainIds } } : {}),
        })

        options.company = {
          $in: companies.map(({ _id }) => _id.toString()),
        }
        options.domain = {
          $in: companies.map(({ domain }) => domain.toString()),
        }

        if (streetsIds) {
          options.street = { $in: streetIds }
        }
      }

      if (type) {
        options.type = type
      }

      const expr = filterPeriodOptions(req.query)
      if (expr.length > 0) {
        options.$expr = {
          $and: expr,
        }
      }

      const streetsPipeline = getStreetsPipeline(isGlobalAdmin, options.domain)

      const streets = await Payment.aggregate(streetsPipeline)
      const addressFilter = getFilterForAddress(streets)

      const { distinctDomains, distinctCompanies } =
        await getDistinctCompanyAndDomain({
          isGlobalAdmin,
          user,
          companyGroup: 'company',
          model: Payment,
        })

      return res.status(200).json({
        domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
          text: domainDetails.name,
          value: domainDetails._id,
        })),
        realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
          text: companyDetails.companyName,
          value: companyDetails._id,
        })),
        addressFilter: addressFilter,
        success: true,
      })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      if (isAdmin) {
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const payment = await Payment.create(req.body)
        return res.status(200).json({ success: true, data: payment })
      } else {
        return (
          res
            .status(400)
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-ignore
            .json({ success: false, message: 'not allowed' })
        )
      }
    } catch (error) {
      // const errors = postValidateBody(req)
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      return res.status(400).json({ success: false, message: error })
    }
  }
}

function filterPeriodOptions(args) {
  const { year, quarter, month, day } = args
  const filterByDateOptions = []
  if (year) {
    filterByDateOptions.push({
      $eq: [{ $year: '$invoiceCreationDate' }, year],
    })
  }
  if (quarter) {
    filterByDateOptions.push({
      $in: [{ $month: '$invoiceCreationDate' }, quarters[+quarter]],
    })
  }
  if (month) {
    filterByDateOptions.push({
      $eq: [{ $month: '$invoiceCreationDate' }, month],
    })
  }
  if (day) {
    filterByDateOptions.push({
      $eq: [{ $dayOfMonth: '$invoiceCreationDate' }, day],
    })
  }
  return filterByDateOptions
}
