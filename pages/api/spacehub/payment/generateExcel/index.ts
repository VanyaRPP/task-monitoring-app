import {
  IGeneratePaymentExcelResponce,
  IExtendedPayment,
} from '@common/api/paymentApi/payment.api.types'
import { NextApiRequest, NextApiResponse } from 'next'
import * as XLSX from 'xlsx-js-style'
import {
  generatePaymentsData,
  getAutoColSize,
} from '@utils/excel/generateExcelData'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const payments: IExtendedPayment[] = req.body.payments
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).send('Invalid or empty payments data')
    }
    const data = generatePaymentsData(payments)
    if (data.length === 0) {
      return res.status(400).send('No data to export')
    }
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    const headers = Object.keys(data[0])
    headers.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: '1F1F1F' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '333333' } },
            bottom: { style: 'thin', color: { rgb: '333333' } },
            left: { style: 'thin', color: { rgb: '333333' } },
            right: { style: 'thin', color: { rgb: '333333' } },
          },
        }
      }
    })

    worksheet['!cols'] = getAutoColSize(data)
    worksheet['!rows'] = [
      { hpt: 80 },
      ...Array(payments.length).fill({ hpt: 43 }),
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments')
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })
    const result: IGeneratePaymentExcelResponce = {
      buffer: excelBuffer,
      fileName: 'payments',
      fileExtension: '.xlsx',
    }
    res.status(200).json(result)
  } catch (error) {
    res.status(500).send(`Error: ${error}`)
  }
}
