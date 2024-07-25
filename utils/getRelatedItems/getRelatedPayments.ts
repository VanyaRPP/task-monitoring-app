import User from '@modules/models/User'
import Payment from '@modules/models/Payment'
import { getRelatedDomains } from './getRelatedDomains'
import { getRelatedServices } from './getRelatedServices'
import { getRelatedCompanies } from './getRelatedCompanies'

export async function getRelatedPayments(userId: string) {
  const { domainIds } = await getRelatedDomains(userId)
  const { serviceIds } = await getRelatedServices(userId)
  const { companyIds } = await getRelatedCompanies(userId)

  const paymentsIds = await Payment.distinct('_id', {
    domain: { $in: domainIds },
    service: { $in: serviceIds },
    company: { $in: companyIds },
  })

  return { paymentsIds }
}
