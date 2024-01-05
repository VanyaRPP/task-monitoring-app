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
