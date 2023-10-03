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

export function getRealEstatesPipeline(isGlobalAdmin, distinctedDomainsIds) {
  return [
    {
      $group: {
        _id: '$company',
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

export function getCreditDebitPipeline(options) {
  return [
    { $match: options }, // Apply the matching based on options
    {
      $group: {
        _id: '$type', // Group by type
        totalSum: { $sum: '$generalSum' }, // Calculate the total sum for each type
      },
    },
  ]
}

export function getMaxInvoiceNumber() {
  return [
      {
        $group: {
          _id: null,
          maxNumber: { $max: '$invoiceNumber' },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]
}
