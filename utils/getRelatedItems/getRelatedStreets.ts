import User from '@modules/models/User'
import Street from '@modules/models/Street'

export async function getRelatedStreets(userId: string) {
    const user = await User.findById(userId).select('email')
    // const domains = await Street.find({adminEmails: user.email}).populate('streets')
    // const domainIds = domains.map(domain => domain._id);
    //return { domainIds }


    const solo = await Street.find({})
    return { solo }
}   