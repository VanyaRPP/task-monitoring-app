import {
  buildDebtCalculationDocument,
  debtCalculationFileName,
  toXlsxStyle,
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

/**
 * Unwraps the real module out of an `import()` result.
 *
 * `xlsx-js-style` and `file-saver` are minified CJS/UMD bundles with no ESM
 * build. Webpack cannot extract named exports from those, so in the browser
 * `await import(...)` hands back `{ default: module.exports }` and reaching for
 * `XLSX.utils` blows up on `undefined`. Jest, by contrast, transpiles
 * `import()` to `require()` and returns the module directly - which is exactly
 * why tests missed this until they started asserting both shapes.
 */
export const interop = <T>(imported: T & { default?: T }): T =>
  imported?.default ?? imported

const toYearMonth = (value?: Dayjs): IYearMonth | undefined =>
  value ? { year: value.year(), month: value.month() + 1 } : undefined

export const useExportExcel = (domainName?: string): IExportExcel => {
  const {
    company,
    result,
    overrides = {},
    from,
    to,
    annualRatePercent,
    inflationMethod,
  } = useDebtCalculationContext()
  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = async (): Promise<void> => {
    if (!result?.rows?.length) {
      message.warning('Немає що експортувати — оберіть компанію й період')
      return
    }

    setIsExporting(true)

    try {
      // `xlsx-js-style` is heavy and browser-only, so it loads at the moment
      // of the click rather than in the page bundle.
      const [xlsxModule, fileSaverModule] = await Promise.all([
        import('xlsx-js-style'),
        import('file-saver'),
      ])
      const XLSX = interop(xlsxModule)
      const { saveAs } = interop(fileSaverModule)

      const periodFrom = toYearMonth(from)
      const periodTo = toYearMonth(to)
      const companyName = company?.companyName ?? 'Компанія'

      const document = buildDebtCalculationDocument({
        companyName,
        description: company?.description,
        domainName,
        result,
        from: periodFrom,
        to: periodTo,
        annualRatePercent,
        inflationMethod,
        area: overrides.area ?? company?.totalArea,
        tariff: overrides.tariff ?? company?.pricePerMeter,
        openingDebt: overrides.openingDebt,
        monthUpdatedAt: Object.fromEntries(
          Object.entries(overrides.months ?? {})
            .filter(([, month]) => !!month?.updatedAt)
            .map(([period, month]) => [period, month.updatedAt])
        ),
      })

      const worksheet = XLSX.utils.aoa_to_sheet(
        document.rows.map((line) => line.map((cell) => cell?.v ?? null))
      )
      worksheet['!cols'] = document.columns

      type Range = { s: { r: number; c: number }; e: { r: number; c: number } }
      const merges: Range[] = []

      document.rows.forEach((line, r) => {
        line.forEach((cell, c) => {
          if (!cell) return

          const address = XLSX.utils.encode_cell({ r, c })
          const target = worksheet[address]
          if (!target) return

          target.s = toXlsxStyle(cell)
          if (cell.numFmt) target.z = cell.numFmt
          if (cell.span && cell.span > 1) {
            merges.push({ s: { r, c }, e: { r, c: c + cell.span - 1 } })
          }
        })
      })

      worksheet['!merges'] = merges
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, document.sheetName)

      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
      saveAs(
        new Blob([buffer], { type: 'application/octet-stream' }),
        `${debtCalculationFileName(companyName, periodFrom, periodTo)}.xlsx`
      )
    } catch (error) {
      // Without this a failure looked like nothing happened: no network, no logs.
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
