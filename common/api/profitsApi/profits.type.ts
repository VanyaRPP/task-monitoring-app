import { ObjectId } from 'mongoose'

export interface Profit {
  _id?: string
  domain: string | ObjectId
  amount: number
  type: 'debit' | 'credit'
  categories?: string[]
  description?: string
  date: string
  createdAt?: string
  updatedAt?: string
}
