export function getDomainsPipeline(isGlobalAdmin, email) {
  return [
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
          $cond: [
            { $eq: [isGlobalAdmin, true] },
            true,
            {
              $in: ['$companyDetails.domain', distinctedDomainsIds],
            },
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

export function getStreetsPipeline(isGlobalAdmin, domains) {
  const pipeline = [
    {
      $match: {},
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

  if (!isGlobalAdmin) {
    const matchStage = {
      $match: {
        $or: [{ domain: domains }],
      },
    }
    pipeline.unshift(matchStage)
  }

  return pipeline
}