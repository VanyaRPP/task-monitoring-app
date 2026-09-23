import {
  buildDebtCalculationSheets,
  debtCalculationFileName,
  ExcelRow,
  IDebtExcelApartment,
  MONTHS_SHEET,
  PARAMS_SHEET,
  SUMMARY_SHEET,
} from '@utils/excel/debt-calculation-excel'
import { IYearMonth } from '@utils/debt-calculation/months'
import { message } from 'antd'
import { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useDebtCalculationContext } from './'

export interface IExportExcel {
  exportExcel: () => Promise<void>
  isExporting: boolean
}

const toYearMonth = (value?: Dayjs): IYearMonth | undefined =>
  value ? { year: value.year(), month: value.month() + 1 } : undefined

/**
 * Дістає реальний модуль із результату `import()`.
 *
 * `xlsx-js-style` і `file-saver` — мініфіковані CJS/UMD бандли без ESM-збірки.
 * Webpack не вміє витягти з таких іменовані експорти, тож у браузері
 * `await import(...)` віддає `{ default: module.exports }`, і звернення до
 * `XLSX.utils` падає з `undefined`. Jest натомість транспілює `import()` у
 * `require()` і віддає модуль напряму — саме тому тести цього не ловили, поки
 * не почали перевіряти обидві форми явно.
 */
export const interop = <T>(imported: T & { default?: T }): T =>
  imported?.default ?? imported

/** Ширина колонки під найдовше значення — інакше все злипається в «####». */
const autoColumns = (rows: ExcelRow[]): { wch: number }[] => {
  if (rows.length === 0) return []

  return Object.keys(rows[0]).map((header) => {
    const longest = rows.reduce(
      (max, row) => Math.max(max, String(row[header] ?? '').length),
      header.length
    )

    return { wch: Math.min(longest + 4, 60) }
  })
}

export const useExportExcel = (domainName?: string): IExportExcel => {
  const { companies, results, from, to, annualRatePercent, inflationMethod } =
    useDebtCalculationContext()
  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = async (): Promise<void> => {
    const apartments: IDebtExcelApartment[] = companies
      .filter(({ _id }) => results[_id]?.rows?.length)
      .map(({ _id, companyName, description }) => ({
        name: companyName,
        description,
        result: results[_id],
      }))

    if (apartments.length === 0) {
      message.warning('Немає що експортувати — оберіть домен і період')
      return
    }

    setIsExporting(true)

    try {
      // `xlsx-js-style` важкий і суто браузерний, тож вантажимо його лише в
      // мить натискання, а не в бандл сторінки.
      const [xlsxModule, fileSaverModule] = await Promise.all([
        import('xlsx-js-style'),
        import('file-saver'),
      ])
      const XLSX = interop(xlsxModule)
      const { saveAs } = interop(fileSaverModule)

      const periodFrom = toYearMonth(from)
      const periodTo = toYearMonth(to)
      const sheets = buildDebtCalculationSheets({
        apartments,
        from: periodFrom,
        to: periodTo,
        annualRatePercent,
        inflationMethod,
        domainName,
      })

      const workbook = XLSX.utils.book_new()

      for (const [name, rows] of [
        [SUMMARY_SHEET, sheets.summary],
        [MONTHS_SHEET, sheets.months],
        [PARAMS_SHEET, sheets.params],
      ] as [string, ExcelRow[]][]) {
        const worksheet = XLSX.utils.json_to_sheet(rows)
        worksheet['!cols'] = autoColumns(rows)

        Object.keys(rows[0] ?? {}).forEach((_, column) => {
          const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })]
          if (cell) cell.s = { font: { bold: true } }
        })

        XLSX.utils.book_append_sheet(workbook, worksheet, name)
      }

      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
      saveAs(
        new Blob([buffer], { type: 'application/octet-stream' }),
        `${debtCalculationFileName(domainName, periodFrom, periodTo)}.xlsx`
      )
    } catch (error) {
      // Без цього збій виглядав як «нічого не сталося»: ні мережі, ні логів.
      console.error('Не вдалося сформувати Excel', error)
      message.error(
        `Не вдалося сформувати файл: ${
          error instanceof Error ? error.message : 'невідома помилка'
        }`
      )
    } finally {
      setIsExporting(false)
    }
  }

  return { exportExcel, isExporting }
}
