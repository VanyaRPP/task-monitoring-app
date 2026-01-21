import User from '@modules/models/User'
import Domain from '@modules/models/Domain'

export async function getRelatedDomains(userId: string) {
  const user = await User.findById(userId).select('email')
  const domains = await Domain.find({
    adminEmails: user.email,
  })
  const domainIds = domains.map((domain) => domain._id)
  return { domainIds }
}
