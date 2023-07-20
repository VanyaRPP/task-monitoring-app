import { MongoClient } from 'mongodb'

const uri = process.env.NEXT_PUBLIC_MONGODB

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}

let client
let clientPromise: any

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise: Promise<MongoClient>
}

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri || '') //dell option
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri || '') //dell option
  clientPromise = client.connect()
}

export default clientPromise
