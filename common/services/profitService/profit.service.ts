import { ProfitModel } from '@modules/models/Profit'
import { Types } from 'mongoose'

export interface CreateProfitInput {
  domain: Types.ObjectId | string
  amount: number
  type: 'debit' | 'credit'
  categories?: string[]
  description?: string
  date: Date
}

class ProfitService {
  static async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      ProfitModel.find()
        .populate('domain')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      ProfitModel.countDocuments(),
    ])

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getByDomain(domainId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      ProfitModel.find({ domain: domainId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      ProfitModel.countDocuments({ domain: domainId }),
    ])

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getById(id: string) {
    return ProfitModel.findById(id).populate('domain')
  }

  static async create(data: CreateProfitInput) {
    return await ProfitModel.create(data)
  }

  static async bulkCreate(data: CreateProfitInput[]) {
    if (!data.length) throw new Error('No records to insert')
    return await ProfitModel.insertMany(data)
  }

  static async update(
    id: string,
    data: Partial<{
      amount: number
      type: 'debit' | 'credit'
      categories: string[]
      description: string
      date: Date
    }>
  ) {
    return ProfitModel.findByIdAndUpdate(id, data, { new: true })
  }

  static async delete(id: string) {
    return ProfitModel.findByIdAndDelete(id)
  }

  static async getBalance(domainId: string) {
    const records = await ProfitModel.find({ domain: domainId })

    let balance = 0
    for (const record of records) {
      if (record.type === 'credit') {
        balance += record.amount
      } else {
        balance -= record.amount
      }
    }

    return balance
  }
}

export default ProfitService
