export function getDomainsPipeline(
  isGlobalAdmin,
  email,
  filteredCompanys = null,
  filteredStreets = null
) {
  return [
    {
      $match: {
        $expr: {
          $cond: [
            { $eq: [filteredCompanys, null] },
            true,
            { $in: ['$_id', filteredCompanys] },
          ],
        },
      },
    },
    {
      $match: {
        $expr: {
          $cond: [
            { $eq: [filteredStreets, null] },
            true,
            { $in: ['$street', filteredStreets] },
          ],
        },
      },
    },
    {
      $group: {
        _id: '$domain',
      },
    },
    {
      $lookup: {
        from: 'domains',
        localField: '_id',
        foreignField: '_id',
        as: 'domainDetails',
      },
    },
    {
      $unwind: '$domainDetails',
    },
    {
      $match: {
        $expr: {
          $cond: [
            { $eq: [isGlobalAdmin, true] },
            true,
            { $in: [email, '$domainDetails.adminEmails'] },
          ],
        },
      },
    },
    {
      $project: {
        'domainDetails.name': 1,
        'domainDetails._id': 1,
      },
    },
  ]
}

export function getRealEstatesPipeline({
  isGlobalAdmin,
  distinctedDomainsIds,
  distinctedStreetsIds,
  group,
}) {
  return [
    {
      $group: {
        _id: `$${group}`,
      },
    },
    {
      $lookup: {
        from: 'realestates',
        localField: '_id',
        foreignField: '_id',
        as: 'companyDetails',
      },
    },
    {
      $unwind: '$companyDetails',
    },
    {
      $match: {
        $expr: {
          $and: [
            { $in: ['$companyDetails.domain', distinctedDomainsIds] },
            { $in: ['$companyDetails.street', distinctedStreetsIds] },
          ],
        },
      },
    },
    {
      $project: {
        'companyDetails.companyName': 1,
        'companyDetails._id': 1,
      },
    },
  ]
}

export function getStreetsPipeline(
  isGlobalAdmin,
  domains,
  filteredCompanys = null,
  filteredDomains = null
) {
  const pipeline = [
    {
      $match: {
        $expr: {
          $cond: [
            { $eq: [filteredCompanys, null] },
            true,
            { $in: ['$_id', filteredCompanys] },
          ],
        },
      },
    },
    {
      $match: {
        $expr: {
          $cond: [
            { $eq: [filteredDomains, null] },
            true,
            { $in: ['$domain', filteredDomains] },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'streets',
        localField: 'street',
        foreignField: '_id',
        as: 'streetData',
      },
    },
    {
      $unwind: '$streetData',
    },
    {
      $project: {
        'streetData.address': 1,
        'streetData.city': 1,
        'streetData._id': 1,
      },
    },
  ]

  return pipeline
}
