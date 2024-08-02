/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import Service from '@common/modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'
import { dateToYear } from '@common/assets/features/formatDate'
import { uniq } from 'lodash'
import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { getFormattedDate } from '@utils/helpers'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  const getDomainFilter = async () => {
    return Service.aggregate([
      {
        $group: {
          _id: "$domain",
        }
      },
      {
        $lookup: {
          from: 'domains',
          localField: '_id',
          foreignField: '_id',
          as: 'domainDetails',
        }
      },
      {
        $unwind: '$domainDetails'
      },
      {
        $project: {
          _id: 0,
          text: '$domainDetails.name',
          value: '$_id'
        }
      }]).exec()
  }

  const getAddressFilter = async () => {
    return Service.aggregate([
      {
        $group: {
          _id: "$street",
        }
      },
      {
        $lookup: {
          from: 'streets',
          localField: '_id',
          foreignField: '_id',
          as: 'addressDetails',
        }
      },
      {
        $unwind: '$addressDetails'
      },
      {
        $project: {
          _id: 0,
          text: '$addressDetails.address (м. ${addressDetails.city})',
          value: '$_id'
        }
      }]).exec()
  }

  const getYearFilter = async () => {
    return Service.aggregate([
      {
        $group: {
          _id: { $year: "$date" },
        }
      },
      {
        $project: {
          _id: 0,
          text: { $toString: "$_id" },
          value: "$_id"
        }
      },
      {
        $sort: {
          text: 1
        }
      }]).exec()
  }

  const getMonthFilter = async (): Promise<{ text: string; value: number }[]> => {
    const results = await Service.aggregate([
      {
        $group: {
          _id: { $month: "$date" }
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id"
        }
      },
      {
        $sort: {
          month: 1
        }
      }
    ]).exec();
  
    return results.map(result => ({
      text: getFormattedDate(new Date(2024, result.month - 1)),
      value: result.month
    }));
  };

  switch (req.method) {
    case 'GET':
          try {
            const { limit, skip, domainId, streetId, serviceId, year, month } = req.query

            if(!isUser && !isDomainAdmin && !isGlobalAdmin) {
              return res.status(200).json({ success: false, data: [] })
            }
    
            const streetsIds: string[] | null = streetId
            ? typeof streetId === 'string'
              ? streetId.split(',').map((id) => decodeURIComponent(id))
              : streetId.map((id) => decodeURIComponent(id))
            : null
    
            const domainsIds: string[] | null = domainId
              ? typeof domainId === 'string'
                ? domainId.split(',').map((id) => decodeURIComponent(id))
                : domainId.map((id) => decodeURIComponent(id))
              : null
    
            const servicesIds: string[] | null = serviceId
              ? typeof serviceId === 'string'
                ? serviceId.split(',').map((id) => decodeURIComponent(id))
                : serviceId.map((id) => decodeURIComponent(id))
              : null
    
            const options: FilterQuery<typeof Service> = {}
            const filters: FilterQuery<typeof Service> = {}
    
            if(domainsIds) {
              filters.domain = { $in: domainsIds }
            }
    
            if(streetsIds) {
              filters.street = { $in: streetsIds }
            }
    
            if(servicesIds) {
              filters._id = { $in: servicesIds }
            }

            if (year && year !== 'null') {
              filters.$expr = filters.$expr || {};
              filters.$expr.$and = filters.$expr.$and || [];
              filters.$expr.$and.push({ $in: [{ $year: "$date" }, year.split(',').map(y => Number(y.trim())).filter(y => !isNaN(y))] });
            }
          
            if (month && month !== 'null') {
              filters.$expr = filters.$expr || {};
              filters.$expr.$and = filters.$expr.$and || [];
              filters.$expr.$and.push({ $in: [{ $month: "$date" }, month.split(',').map(m => Number(m.trim())).filter(m => !isNaN(m))] });
            }
    
            if (isDomainAdmin) {
              const domains = await Domain.find({
                ...(filters.domain ? { _id: filters.domain } : {}),
                adminEmails: { $in: [user.email] },
              });
    
              if (domains) {
                options.domain = { $in: domains.map(({ _id }) => _id) }
              }
            }
    
            if (isUser) {
              const companies = await RealEstate.find({
                ...(filters.domain ? { domain: filters.domain } : {}),
                adminEmails: { $in: [user.email] },
              });
    
              if (companies) {
                options.domain = { $in: companies.map(({ domain }) => domain) }
              }
            }

            const data = await Service.find({$and: [options, filters]})
                .limit(+limit)
                .skip(+skip)
                .populate('domain')
                .populate('street')
                const domainFilter = await getDomainFilter()
                const addressFilter = await getAddressFilter()
                const yearFilter = await getYearFilter()
                const monthFilter = await getMonthFilter()
              return res.status(200).json({ 
                success: true,
                data: data,
                domainFilter: domainFilter,
                addressFilter: addressFilter,
                yearFilter: yearFilter,
                monthFilter: monthFilter,
                })
          } catch (error) {
            return res.status(400).json({ success: false, error: error.message })
          }

    case 'POST':
      try {
        if (isAdmin) {
          // TODO: body validation
          const service = await Service.create(req.body)
          return res.status(200).json({ success: true, data: service })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
  }
}

function filterPeriodOptions(args) {
  const { year, month } = args
  const filterByDateOptions = []
  if (year) {
    filterByDateOptions.push({ $eq: [{ $year: '$date' }, year] })
  }
  if (month) {
    filterByDateOptions.push({ $eq: [{ $month: '$date' }, month] })
  }
  return filterByDateOptions
}
