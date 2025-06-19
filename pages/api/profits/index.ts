import ProfitService, { CreateProfitInput } from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isAdmin, user } = await getCurrentUser(req, res)
  if (!isAdmin) return res.status(403).json({ success: false })

  try {
    switch (req.method) {
      case 'GET': {
        const { page = '1', limit = '10' } = req.query
        const data = await ProfitService.getAllWithMonthSeparation(
          +page,
          +limit
        )
        return res.status(200).json({ success: true, ...data })
      }

      case 'POST': {
        const {
          domain,
          amount,
          type,
          description,
          date,
          categories,
          invoiceNumber,
          payment,
        } = req.body

        if (!domain || !amount || !type || !date) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: domain, amount, type, or date',
          })
        }

        if (!['debit', 'credit'].includes(type)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid type. Allowed values: "debit" or "credit"',
          })
        }

        const profitDocument: CreateProfitInput = {
          domain,
          createdBy: user._id.toString(),
          amount: Number(amount),
          type,
          date: new Date(date),
          description: description?.trim() || '',
          categories: Array.isArray(categories) ? categories : [],
          invoiceNumber: invoiceNumber?.trim(),
          payment,
        }
        
        try {
          const record = await ProfitService.create(profitDocument)
          return res.status(200).json({ success: true, data: record })
        } catch (error) {
          console.error('Error creating profit record:', error)
          return res.status(500).json({
            success: false,
            error: 'Server error while creating profit record',
          })
        }
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
