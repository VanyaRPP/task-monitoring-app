import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

export const setupTestEnvironment = () => {
  beforeAll(async () => {
    const mongo = await MongoMemoryServer.create()
    const mongoUri = mongo.getUri()

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any)
  })

  afterEach(async () => {
    await mongoose.connection.dropDatabase()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })
}
