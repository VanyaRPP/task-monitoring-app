import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

import Domain from '@common/modules/models/Domain'
import Payment from '@common/modules/models/Payment'
import RealEstate from '@common/modules/models/RealEstate'
import Service from '@common/modules/models/Service'
import Street from '@common/modules/models/Street'
import User from '@common/modules/models/User'

import {
  domains,
  payments,
  realEstates,
  services,
  streets,
  users,
} from '@utils/testData'

export const setupTestEnvironment = () => {
  const server = new MongoMemoryServer()

  beforeAll(async () => {
    await server.start()

    mongoose.set('strictQuery', false)
    mongoose.connect(server.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any)
  })

  beforeEach(async () => {
    await User.insertMany(Object.values(users))
    await (Street as any).insertMany(streets)
    await (Domain as any).insertMany(domains)
    await (RealEstate as any).insertMany(realEstates)
    await (Service as any).insertMany(services)
    await (Payment as any).insertMany(payments)
  })

  afterEach(async () => {
    await mongoose.connection.dropDatabase()
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await server.stop()
  })
}
