import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

export const setupTestEnvironment = () => {
  const server = new MongoMemoryServer()

  beforeAll(async () => {
    await server.start()
    await mongoose.connect(server.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any)
  })

  afterEach(async () => {
    await mongoose.connection.dropDatabase()
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await server.stop()
  })
}
