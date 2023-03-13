import { ObjectId } from 'mongoose'

export interface IOptionsParams {
  limit: number
  userId?: string | ObjectId
  isAdmin?: boolean
  email?: string | string[]
}

export interface IBeParams {
  isAdmin: boolean
  req: string | ObjectId
  userIdByEmail: string | ObjectId
}
