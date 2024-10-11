import { dateToDefaultFormat } from '@assets/features/formatDate'
import * as XLSX from 'xlsx'

export function generatePaymentsData(data) {
    return data.map((payment) => ({
        'Надавач послуг': `${payment.domain.name}`,
        'Компанія': `${payment.company.companyName}`,
        'Дата створення': dateToDefaultFormat(payment.invoiceCreationDate),
        'Дебет': `${payment.generalSum || '-'}`,
        'Кредит': `${payment.company.companyName || '-'}`,
        'Утримання': `${payment.monthService.rentPrice}`,
        'Електропостачання': `${payment.monthService.electricityPrice}`,
        'Водопостачання': `${payment.monthService.waterPrice}`,
        'Водонарахування': `${payment.monthService.waterPriceTotal}`,
        'Вивіз ТПВ': `${payment.monthService.garbageCollectorPrice}`,
        'Індекс інфляції': `${payment.monthService.inflicionPrice}`,
        'Розміщення': `${payment.company.pricePerMeter * payment.company.totalArea}`,
    }))
}

export function getPaymentsColSize() {
    return [
        { wch: 15 }, // Надавач послуг
        { wch: 15 }, // Компанія
        { wch: 15 }, // Дата створення
        { wch: 15 }, // Дебет
        { wch: 15 }, // Кредит
        { wch: 15 }, // Утримання
        { wch: 15 }, // Електропостачання
        { wch: 15 }, // Водопостачання
        { wch: 15 }, // Водонарахування
        { wch: 15 }, // Вивіз ТПВ
        { wch: 15 }, // Iндекс інфляції
        { wch: 15 }, // Розміщення
    ]
}

export function getPaymentsRowSize(data) {
    return Array(data.length + 1).fill({ hpt: 40 })
}