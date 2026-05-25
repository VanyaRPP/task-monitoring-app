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
      $match: {
        $expr: {
          $cond: [
            { $eq: [isGlobalAdmin, true] },
            true,
            { $in: [email, '$adminEmails'] },
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
  archived,
}) {
  const pipeline: any[] = [
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
  ]

  if (archived === true || archived === 'true') {
    pipeline.push({
      $match: { 'companyDetails.archived': true },
    })
  }
  if (archived === false || archived === 'false') {
    pipeline.push({
      $match: { 'companyDetails.archived': { $ne: true } },
    })
  }

  pipeline.push({
    $project: {
      'companyDetails.companyName': 1,
      'companyDetails._id': 1,
      'companyDetails.archived': 1,
    },
  })

  return pipeline
}

export function getStreetsPipeline(
  isGlobalAdmin,
  email,
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
      $match: {
        $expr: {
          $cond: [
            { $eq: [isGlobalAdmin, true] },
            true,
            { $in: [email, '$adminEmails'] },
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
