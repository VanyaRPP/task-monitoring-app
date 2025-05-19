import { dateToDefaultFormat } from '@assets/features/formatDate'
import dayjs from 'dayjs'

function formatNumber(value: number | string | undefined | null): string {
  const num = Number(value);
  if (isNaN(num) || num === 0) return '-';
  const hasFraction = num % 1 !== 0;

  return hasFraction
    ? num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') 
    : num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); 
}

export function generatePaymentsData(data) {
  return data.map((payment) => ({
    'Надавач послуг': styled(payment.domain?.name, 'Надавач послуг'),
    'Компанія': styled(payment.company?.companyName, 'Компанія'),
    'Дата створення': styled(dateToDefaultFormat(payment.invoiceCreationDate), 'Дата створення'),
    'Дебет': styled(payment.type === 'debit' && payment.generalSum != null? formatNumber(payment.generalSum): '-','Дебет'),
    'Кредит': styled(payment.type === 'credit' && payment.generalSum != null? formatNumber(payment.generalSum): '-','Кредит'),
    'За місяць': styled(payment?.monthService?.date? dayjs(payment.monthService.date).format('MMMM YYYY') : '-','За місяць'),
    'Розміщення': styled(formatNumber(getInvoiceSum(payment, 'placingPrice')), 'Розміщення'),
    'Утримання': styled(formatNumber(getInvoiceSum(payment, 'maintenancePrice')), 'Утримання'),
    'Індекс інфляції': styled(formatNumber(getInvoiceSum(payment, 'inflicionPrice')), 'Індекс інфляції'),
    'Електропостачання': styled(formatNumber(getInvoiceSum(payment, 'electricityPrice')), 'Електропостачання'),
    'Водопостачання': styled(formatNumber(getInvoiceSum(payment, 'waterPrice')), 'Водопостачання'),
    'Вивіз ТПВ': styled(formatNumber(getInvoiceSum(payment, 'garbageCollectorPrice')), 'Вивіз ТПВ'),
    'Водонарахування': styled(formatNumber(getInvoiceSum(payment, 'waterPart')), 'Водонарахування'),
    'Знижка': styled(formatNumber(getInvoiceSum(payment, 'discount')), 'Знижка'),
    'Прибирання': styled(formatNumber(getInvoiceSum(payment, 'cleaningPrice')), 'Прибирання'),
    'Додаткові послуги': styled(formatNumber((payment.invoice || []).find(i => i.type === 'custom')?.price), 'Додаткові послуги'),
  }))
}
function getInvoiceSum(payment, type) {
  const item = payment.invoice?.find(
    (inv) => inv.type?.toLowerCase() === type.toLowerCase()
  )
  return item?.sum ?? 0
}

function styled(value, colKey) {
  const isBlueColumn = colKey === 'Надавач послуг' || colKey === 'Компанія'
 return {
    v: value,
    s: {
      font: {
        name: 'Arial',
        sz: 11,
        color: isBlueColumn ? { rgb: 'B366FF' } : { rgb: 'DDDDDD' },
      },
      fill: { fgColor: { rgb: '2A2A2A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '444444' } },
        bottom: { style: 'thin', color: { rgb: '444444' } },
        left: { style: 'thin', color: { rgb: '444444' } },
        right: { style: 'thin', color: { rgb: '444444' } },
      },
    },
  }
}

export function getAutoColSize(data) {
  if (!Array.isArray(data) || data.length === 0) return []

  const headers = Object.keys(data[0])
  const colWidths = headers.map(header => header.length) 

  data.forEach((row) => {
    headers.forEach((key, i) => {
      const cell = row[key]
      const text = typeof cell?.v === 'string' || typeof cell?.v === 'number'
        ? String(cell.v)
        : ''
      colWidths[i] = Math.max(colWidths[i], text.length)
    })
  })
  return colWidths.map((width) => ({ wch: width + 5 }))
}

export function getPaymentsRowSize(data) {
  return [{ hpt: 40 }, ...Array(data.length).fill({ hpt: 32 })]
}
