import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import Street from '@modules/models/Street'
import User from '@modules/models/User'
import Profit from '@modules/models/Profit'

import {
  domains,
  payments,
  realEstates,
  services,
  streets,
  users,
  profits,
} from '@utils/testData'

export const setupTestEnvironment = () => {
  // Each suite spins up its own mongod. When Jest runs many suites in parallel
  // under load, the default 10s launch timeout is too tight and the instance
  // spuriously fails with "Instance failed to start within 10000ms", cascading
  // into hook timeouts. Give it generous headroom.
  const server = new MongoMemoryServer({
    instance: { launchTimeout: 60000 },
  })

  beforeAll(async () => {
    await server.start()

    mongoose.set('strictQuery', false)
    await mongoose.connect(server.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any)
  }, 120000) // mongod binary may need to download/boot on a cold run (> launchTimeout)

  beforeEach(async () => {
    await User.insertMany(Object.values(users))
    await (Street as any).insertMany(streets)
    await (Domain as any).insertMany(domains)
    await (RealEstate as any).insertMany(realEstates)
    await (Service as any).insertMany(services)
    await (Payment as any).insertMany(payments)
    await (Profit as any).insertMany(profits)
  })

  afterEach(async () => {
    await mongoose.connection.dropDatabase()
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await server.stop()
  })
}
