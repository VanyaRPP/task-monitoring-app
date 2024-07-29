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
import { getFormattedDate } from '@utils/helpers'

start()

export interface IFilter {
  value: any
  lable: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  const domainFilters = (data, filters) => {
    const domainFilter = []

    filters.map((filter) => {
      data?.domain?._id.find(domain => domain._id === filter)
    })
  }

  const createDomainFilter = async () => {
    return await Service.aggregate([
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

  const createAddressFilter = (data) => {
    const addressFilter = []

    data.map((serviceInfo) => {
      if(serviceInfo?.street?._id && !addressFilter.some(address => address.value.toString() === serviceInfo?.street?._id.toString())) {
        addressFilter.push({
          text: `${serviceInfo?.street?.address.toString()} (м. ${serviceInfo?.street?.city.toString()})`,
          value: serviceInfo.street._id.toString(),
        })
      }
    })
    return addressFilter
  }

  const createYearFilter = (data) => {
    const yearFilter = []

    data.map((serviceInfo) => {
      if(serviceInfo?.date && !yearFilter.some(date => date.value.toString() === dateToYear(serviceInfo?.date))) {
        yearFilter.push({
          text: `${dateToYear(serviceInfo?.date)}`,
          value: dateToYear(serviceInfo?.date),
        })
      }
    })
    return yearFilter
  }

  const createMonthFilter = (data) => {
    const monthFilter = []

    data.map((serviceInfo) => {
      if(serviceInfo?.date && !monthFilter.some(date => date.value.toString() === getFormattedDate(serviceInfo?.date))) {
        monthFilter.push({
          text: `${getFormattedDate(serviceInfo?.date)}`,
          value: getFormattedDate(serviceInfo?.date),
        })
      }
    })
    return monthFilter
  }

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

            if (year && !isNaN(Number(year))) {
              if (!filters.$expr) filters.$expr = { $and: [] };
              filters.$expr.$and.push({ $eq: [{ $year: "$date" }, +year] });
            }
          
            if (month && !isNaN(Number(month))) {
              if (!filters.$expr) filters.$expr = { $and: [] };
              filters.$expr.$and.push({ $eq: [{ $month: "$date" }, +month] });
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
              // const uniques = domainFilters(data, await Service.distinct('domain', options).populate('domain'))
              const uniques = await Service.aggregate([
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
                }]).exec();
              return res.status(200).json({ 
                success: true,
                data: data,
                domainFilter: uniques,
                addressFilter: createAddressFilter(data),
                yearFilter: createYearFilter(data),
                monthFilter: createMonthFilter(data),
                test: uniques,
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
