import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || process.env.AMPLIFY_MONGODB_URI
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}

let client
let clientPromise: any

// if (!uri) {
//   throw new Error('Please add your Mongo URI to .env.local')
// }

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise: Promise<MongoClient>
}

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI || '') //dell option
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(process.env.MONGODB_URI || '') //dell option
  clientPromise = client.connect()
}

export default clientPromise
