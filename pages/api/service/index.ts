/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import Service from '@common/modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  const createDomainFilter = (data) => {
    const domainFilter = []

    data.map((serviceInfo) => {
      if(!domainFilter.some(domain => domain.value.toString() === serviceInfo.domain._id.toString())) {
        domainFilter.push({
          text: serviceInfo.domain.name.toString(),
          value: serviceInfo.domain._id.toString(),
        })
      }
    })
    return domainFilter
  }

  const createAddressFilter = (data) => {
    const addressFilter = []

    data.map((serviceInfo) => {
      if(!addressFilter.some(address => address.value.toString() === serviceInfo.street._id.toString())) {
        addressFilter.push({
          text: `${serviceInfo.street.address.toString()} (м. ${serviceInfo.street.city.toString()})`,
          value: serviceInfo.street._id.toString(),
        })
      }
    })
    return addressFilter
  }

  switch (req.method) {
    case 'GET':
          try {
            const { limit, skip, domainId, streetId, serviceId, year, month } = req.query
    
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
    
            if(domainsIds) {
              options.domain = { $in: domainsIds }
            }
    
            if(streetsIds) {
              options.street = { $in: streetsIds }
            }
    
            if(servicesIds) {
              options._id = { $in: servicesIds }
            }
            if (year && month && !isNaN(Number(year)) && !isNaN(Number(month))) {
              options.date = {
                $gte: new Date(+year, +month, 1, 0, 0, 0), // first second of provided YY.MM
                $lt: new Date(+year, +month + 1, 0, 23, 59, 59, 999), // last second of provided YY.MM
              }
            }
            // if (streetsIds) {
            //   options.street = { $in: streetsIds }
            // }
            // if (domainsIds) {
            //   options.domain = { $in: domainsIds }
            // }
            // if (servicesIds) {
            //   options._id = { $in: servicesIds }
            // }
    
            // const options = {
            //   domain: { $in: domainsIds },
            //   street: { $in: streetsIds },
            //   _id: servicesIds,
            //   date: {
            //     $gte: new Date(+year, +month, 1, 0, 0, 0), // first second of provided YY.MM
            //     $lt: new Date(+year, +month + 1, 0, 23, 59, 59, 999), // last second of provided YY.MM
            //   },
            // }
            // console.log(options.domain.$in)
    
    
            // if (!servicesIds) delete options._id
            // if (!streetsIds) delete options.street
            // if (!domainsIds) delete options.domain
            // console.log(options)
            // if (!year  !month  isNaN(Number(year)) || isNaN(Number(month)))
            //   delete options.date
    
            if (isGlobalAdmin) {
              const data = await Service.find(options)
                .limit(+limit)
                .skip(+skip)
                .populate('domain')
                .populate('street')
              // console.log(createDomainFilter(data))
              return res.status(200).json({ 
                success: true,
                data: data,
                domainFilter: createDomainFilter(data),
                addressFilter: createAddressFilter(data),
                })
            }
    
            if (isDomainAdmin) {
              const domains = await Domain.find({
                ...(options.domain ? { _id: options.domain } : {}),
                adminEmails: { $in: [user.email] },
              });
    
              if (domains) {
                options.domain = { $in: domains.map(({ _id }) => _id) }
    
                const data = await Service.find(options)
                  .limit(+limit)
                  .skip(+skip)
                  .populate('domain')
                  .populate('street')
    
                return res.status(200).json({ success: true, data: data })
              }
            }
    
            if (isUser) {
              const companies = await RealEstate.find(
                options.domain
                  ? {
                      domain: options.domain,
                      adminEmails: { $in: [user.email] },
                    }
                  : {
                      adminEmails: { $in: [user.email] },
                    }
              )
    
              if (companies) {
                options.domain = { $in: companies.map(({ domain }) => domain) }
    
                const services = await Service.find(options)
                  .limit(+limit)
                  .skip(+skip)
                  .populate('domain')
                  .populate('street')
    
                return res.status(200).json({ success: true, data: services })
              }
            }
      return res.status(200).json({ success: false, data: [] })
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
