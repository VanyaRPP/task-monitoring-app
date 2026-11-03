import {
  FILL,
  IDebtExcelDocument,
  IExcelCell,
} from '@utils/excel/debt-calculation-excel'
import React, { forwardRef } from 'react'
import s from './style.module.scss'

/**
 * A number as Excel shows it with the cell's format: `0.00` → `1234,56`,
 * `0.000000` → six places. A text cell is shown as is.
 */
export const formatCell = ({ v, numFmt }: IExcelCell): string => {
  if (typeof v !== 'number') return v
  const places = numFmt?.split('.')[1]?.length ?? undefined
  return new Intl.NumberFormat('uk-UA', {
    useGrouping: false,
    ...(places !== undefined
      ? { minimumFractionDigits: places, maximumFractionDigits: places }
      : { maximumFractionDigits: 10 }),
  }).format(v)
}

interface Props {
  document: IDebtExcelDocument
}

/**
 * The calculation document as an HTML table - the same cells, merges, bold,
 * fills and number formats the Excel file gets, so the printout is the file.
 */
const DebtDocumentTable = forwardRef<HTMLDivElement, Props>(
  ({ document }, ref) => {
    const width = document.columns.length
    // Excel's widths as shares of the row, so the table fits the modal and an
    // A4 page alike.
    const total = document.columns.reduce((sum, { wch }) => sum + wch, 0)

    return (
      <div ref={ref} className={s.PrintDocument}>
        <table className={s.PrintTable}>
          <colgroup>
            {document.columns.map(({ wch }, index) => (
              <col key={index} style={{ width: `${(wch / total) * 100}%` }} />
            ))}
          </colgroup>
          <tbody>
            {document.rows.map((line, r) => {
              const cells: React.ReactNode[] = []
              for (let c = 0; c < width;) {
                const cell = line[c]
                const span = Math.max(1, cell?.span ?? 1)
                cells.push(
                  <td
                    key={c}
                    colSpan={span}
                    className={cell?.border ? s.PrintBordered : undefined}
                    style={
                      cell
                        ? {
                            fontWeight: cell.bold ? 600 : undefined,
                            textAlign: cell.align ?? 'left',
                            background: cell.fill
                              ? `#${FILL[cell.fill]}`
                              : undefined,
                          }
                        : undefined
                    }
                  >
                    {cell ? formatCell(cell) : ''}
                  </td>
                )
                c += span
              }
              return <tr key={r}>{cells}</tr>
            })}
          </tbody>
        </table>
      </div>
    )
  }
)

DebtDocumentTable.displayName = 'DebtDocumentTable'

export default DebtDocumentTable
