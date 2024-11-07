import {
  IGeneratePaymentExcel,
  IGeneratePaymentExcelResponce,
} from '@common/api/paymentApi/payment.api.types'
import { NextApiRequest, NextApiResponse } from 'next'
import * as XLSX from 'xlsx'
import {
  generatePaymentsData,
  getPaymentsColSize,
  getPaymentsRowSize,
} from '@utils/excel/generateExcelData'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req?.method) {
    case 'POST':
      try {
        const data = generatePaymentsData(req.body.payments)
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(data)

        worksheet['!cols'] = getPaymentsColSize()
        worksheet['!rows'] = getPaymentsRowSize(req.body.payments)
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments')

        const excelBuffer = XLSX.write(workbook, {
          type: 'buffer',
          bookType: 'xlsx',
        })
        res.status(200).send({
          buffer: excelBuffer,
          fileName: 'payments',
          fileExtension: '.xlsx',
        })
      } catch (error) {
        res.status(500).send(`Error${error}`)
      }
      break
  }
}
