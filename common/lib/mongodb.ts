import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

let client

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise: Promise<MongoClient>
}

// Cached on `global` in every environment, not just development. Each Lambda
// container that skipped the cache opened its own pool, so scaling multiplied
// connections against Atlas until server selection started failing — the same
// error the mongoose path reports. This is also the adapter NextAuth uses, so
// exhausting it degrades every authenticated request, app-wide.
if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri)
  globalWithMongo._mongoClientPromise = client.connect()

  // Attach a handler so a failed connect is never an unhandled rejection (which
  // would take the container down). Consumers awaiting the promise still see
  // the rejection and can report it.
  globalWithMongo._mongoClientPromise.catch(() => undefined)
}

const clientPromise: Promise<MongoClient> = globalWithMongo._mongoClientPromise

export default clientPromise
