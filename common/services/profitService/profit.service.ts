import ProfitModel from '@modules/models/Profit'
import mongoose, { Types } from 'mongoose'

export interface CreateProfitInput {
  domain: Types.ObjectId | string
  payment?: Types.ObjectId | string
  amount: number
  type: 'debit' | 'credit'
  categories?: string[]
  description?: string
  invoiceNumber?: string
  date: Date
}

class ProfitService {
  static async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      ProfitModel.find()
        // .populate('domain')
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

  static async getAllWithMonthSeparation(page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [groupedData, total] = await Promise.all([
      ProfitModel.aggregate([
        {
          $sort: { date: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            profits: { $push: '$$ROOT' },
          },
        },
        {
          $sort: {
            '_id.year': -1,
            '_id.month': -1,
          },
        },
      ]),
      ProfitModel.countDocuments(),
    ])

    const data = {}
    for (const group of groupedData) {
      const { year, month } = group._id
      const monthName = new Date(year, month - 1).toLocaleString('en-US', {
        month: 'long',
      })
      const key = `${monthName} ${year}`
      data[key] = group.profits
    }

    return {
      data,
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

  static async getByDomainWithMonthSeparation(
    domainId: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit

    const [groupedData, total] = await Promise.all([
      ProfitModel.aggregate([
        {
          $match: { domain: new mongoose.Types.ObjectId(domainId) },
        },
        {
          $sort: { date: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            profits: { $push: '$$ROOT' },
          },
        },
        {
          $sort: {
            '_id.year': -1,
            '_id.month': -1,
          },
        },
      ]),
      ProfitModel.countDocuments({ domain: domainId }),
    ])

    const data: Record<string, (typeof groupedData)[0]['profits']> = {}

    for (const group of groupedData) {
      const { year, month } = group._id
      const monthName = new Date(year, month - 1).toLocaleString('en-US', {
        month: 'long',
      })
      const key = `${monthName} ${year}`
      data[key] = group.profits
    }

    return {
      data,
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
    try {
      const profit = await ProfitModel.create(data)
      return profit
    } catch (error) {
      console.error('Failed to create Profit record:', error)
      throw new Error('Unable to create profit. Please try again later.')
    }
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

  static async updatePayment(
    paymentId: string,
    data: Partial<{
      amount: number
      type: 'debit' | 'credit'
      categories: string[]
      description: string
      invoiceNumber: string
      date: Date
    }>
  ) {
    return ProfitModel.findOneAndUpdate({ payment: paymentId }, data, {
      new: true,
    })
  }

  static async delete(id: string) {
    return ProfitModel.findByIdAndDelete(id)
  }
  static async deleteByIdPayment(paymentId: string) {
    return ProfitModel.findOneAndDelete({ payment: paymentId })
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
