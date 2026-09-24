import React from 'react'
import type { TableColumnsType } from 'antd'

const leaves = (column: any): any[] =>
  Array.isArray(column?.children) ? column.children.flatMap(leaves) : [column]

/**
 * Суми послуг рахують ефекти всередині комірок (setFieldValue у useEffect).
 * Тому приховану колонку не можна просто прибрати з дерева: її комірки мають
 * лишатися змонтованими, інакше суми не обчислюються й випадають із «Сума» та з
 * рахунку. Рендеримо їх у невидимому контейнері — змінюється лише відображення.
 */
const HiddenColumnCells: React.FC<{
  columns: TableColumnsType
  names: number[]
}> = ({ columns, names }) => {
  const cells = columns.flatMap(leaves).filter((c) => c?.render)
  if (!cells.length || !names.length) return null

  return (
    <div style={{ display: 'none' }} aria-hidden data-testid="hidden-cells">
      {names.map((name, index) =>
        cells.map((c, i) => (
          <React.Fragment key={`${name}-${i}`}>
            {c.render(undefined, { name } as any, index)}
          </React.Fragment>
        ))
      )}
    </div>
  )
}

export default HiddenColumnCells
