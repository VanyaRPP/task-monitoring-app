
import { ProfitModel } from '@modules/models/Profit'
import { Types } from 'mongoose'

class ProfitService {
  static async getAll() {
    return ProfitModel.find().populate('domain')
  }

  static async create(data: {
    domain: Types.ObjectId | string
    amount: number
    type: 'debit' | 'credit'
    categories?: string[]
    description?: string
    date: Date
  }) {
    return await ProfitModel.create(data)
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

  static async getById(id: string) {
    return ProfitModel.findById(id).populate('domain')
  }

  static async getByDomain(domainId: string) {
    return ProfitModel.find({ domain: domainId }).sort({ date: -1 })
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
