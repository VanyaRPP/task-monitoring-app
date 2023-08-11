import dbConnect from 'utils/dbConnect'
import '@common/modules/models/RealEstate'
import '@common/modules/models/Domain'
import '@common/modules/models/Payment'
import '@common/modules/models/Service'
import '@common/modules/models/Street'

export type Data = {
  data?: any
  success: boolean
  error?: any
  // message?: string
}

const start = async () => {
  await dbConnect()
}

export default start
