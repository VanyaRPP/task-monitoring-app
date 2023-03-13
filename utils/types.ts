import { ObjectId } from 'mongoose'

export interface IOptionsParams {
  limit: number
  userId?: string
  isAdmin?: boolean
  email?: string
}

export interface IBeParams {
  isAdmin: boolean
  req: string | ObjectId
  userId: string | ObjectId
}
