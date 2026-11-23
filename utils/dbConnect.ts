import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {}

    // A rejected connect must not stay cached. `cached.promise` lives on
    // `global`, so on a Lambda container it outlives the request: without this
    // reset every later request awaits the same rejected promise and the
    // container serves nothing but 500s until it is recycled — one transient
    // Atlas blip turning into a sustained outage. Clearing it lets the next
    // call dial again.
    cached.promise = mongoose.connect(MONGODB_URI, opts).catch((error) => {
      cached.promise = null
      throw error
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
