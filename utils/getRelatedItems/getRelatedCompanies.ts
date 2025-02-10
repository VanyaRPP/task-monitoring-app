import User from '@modules/models/User'
import RealEstate from '@modules/models/RealEstate'
import { getRelatedDomains } from './getRelatedDomains'

export async function getRelatedCompanies(userId: string) {
    //const user = await User.findById(userId).select('email')
    const { domainIds } = await getRelatedDomains(userId)
    const companies = await RealEstate.find({
        domain: { $in: domainIds },
    });

    const companyIds = companies.map(company => company._id);

    return { companyIds }
}   