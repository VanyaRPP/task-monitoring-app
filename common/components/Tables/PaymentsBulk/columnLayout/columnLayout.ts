import { arrayMove } from '@dnd-kit/sortable'
import type { TableColumnsType } from 'antd'

type Column = TableColumnsType[number]

/** Рухома = має `key` і не закріплена (Сума / Компанія / видалення — ні). */
export const isMovableColumn = (column: Column): boolean =>
  column.key != null && !column.fixed

export const getMovableKeys = (columns: TableColumnsType): string[] =>
  columns.filter(isMovableColumn).map((c) => String(c.key))

/**
 * Зберігає порядок користувача: наявні ключі — як були, зниклі — прибрані,
 * нові — на своє місце за замовчуванням (одразу після попереднього ключа з
 * `keys`), а не в кінець — інакше нова послуга опинилась би правіше «Суми».
 */
export const mergeOrder = (prev: string[], keys: string[]): string[] => {
  const result = prev.filter((k) => keys.includes(k))
  keys.forEach((key, i) => {
    if (result.includes(key)) return
    const before = keys
      .slice(0, i)
      .reverse()
      .find((k) => result.includes(k))
    result.splice(before ? result.indexOf(before) + 1 : 0, 0, key)
  })
  return result
}

export const moveColumn = (
  order: string[],
  activeKey: string,
  overKey: string
): string[] => {
  const from = order.indexOf(activeKey)
  const to = order.indexOf(overKey)
  if (from < 0 || to < 0 || from === to) return order
  return arrayMove(order, from, to)
}

export const toggleHidden = (hidden: string[], key: string): string[] =>
  hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]

/**
 * Застосовує порядок і видимість до верхнього рівня колонок. Колонки без
 * `key` (Сума, Компанія, видалення) фіксовані: не рухаються і не ховаються.
 * Рухомі колонки розкладаються по «слотах» рухомих у порядку `order`.
 */
export const applyColumnLayout = (
  columns: TableColumnsType,
  order: string[],
  hidden: string[]
): TableColumnsType => {
  const movable = columns
    .filter(isMovableColumn)
    .sort((a, b) => order.indexOf(String(a.key)) - order.indexOf(String(b.key)))
  let i = 0
  return columns
    .map((c) => (isMovableColumn(c) ? movable[i++] : c))
    .filter((c) => !(c.key != null && hidden.includes(String(c.key))))
}

/**
 * Закріплює (fixed) колонки з `pins`, але лише поки вони стоять на своєму краю:
 * antd вимагає, щоб fixed-left/right колонки йшли суцільно від краю таблиці.
 */
export const pinEdgeColumns = (
  columns: TableColumnsType,
  pins: Partial<Record<string, 'left' | 'right'>>
): TableColumnsType => {
  const result = [...columns]
  const pinFrom = (side: 'left' | 'right', indices: number[]) => {
    for (const i of indices) {
      const c = result[i]
      if (c.fixed === side) continue
      if (c.key == null || pins[String(c.key)] !== side) return
      result[i] = { ...c, fixed: side }
    }
  }
  const indices = result.map((_, i) => i)
  pinFrom('left', indices)
  pinFrom('right', [...indices].reverse())
  return result
}
