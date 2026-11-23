import { toXlsxStyle } from '@utils/excel/debt-calculation-excel'
import { message } from 'antd'
import { useState } from 'react'
import { useDebtDocument } from './useDebtDocument'

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

export const useExportExcel = (domainName?: string): IExportExcel => {
  const buildDocument = useDebtDocument(domainName)
  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = async (): Promise<void> => {
    const built = buildDocument()
    if (!built) {
      message.warning('Немає що експортувати — оберіть компанію й період')
      return
    }
    const { document, fileName } = built

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
        `${fileName}.xlsx`
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
