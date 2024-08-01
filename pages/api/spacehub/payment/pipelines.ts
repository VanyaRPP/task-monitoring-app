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

export function getInvoicesTotalPipeline(options) {
  return [
    { $match: options },
    {
      $unwind: '$invoice',
    },
    {
      $addFields: {
        'invoice.sum': { $toDouble: '$invoice.sum' },
      },
    },
    {
      $group: {
        _id: '$invoice.type',
        totalSum: { $sum: '$invoice.sum' },
      },
    },
  ]
}

export function getTotalGeneralSumPipeline(options) {
  return [
    { $match: options },
    {
      $group: {
        _id: 'generalSum',
        totalSum: { $sum: '$generalSum' },
      },
    },
  ]
}
