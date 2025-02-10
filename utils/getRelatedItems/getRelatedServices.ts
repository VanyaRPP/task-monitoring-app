import User from '@modules/models/User'
import Service from '@modules/models/Service'
import { getRelatedDomains } from './getRelatedDomains'
export async function getRelatedServices(userId: string) {
    //const user = await User.findById(userId).select('email')
    const { domainIds } = await getRelatedDomains(userId)
    const services = await Service.find({
        domain: { $in: domainIds },
    });

    const serviceIds = services.map(service => service._id);

    return { serviceIds }
}   