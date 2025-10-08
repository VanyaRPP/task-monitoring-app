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
  createdBy?: {
    _id?: string
    name: string
    email: string
  }
}

export interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GroupedProfitResponse {
  data: Record<string, Profit[]>
  meta: Meta
}
