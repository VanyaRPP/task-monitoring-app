import { arrayMove } from '@dnd-kit/sortable'
import type { TableColumnsType } from 'antd'

/** Зберігає порядок: наявні ключі — як були, нові — в кінець, зниклі — прибрані. */
export const mergeOrder = (prev: string[], keys: string[]): string[] => [
  ...prev.filter((k) => keys.includes(k)),
  ...keys.filter((k) => !prev.includes(k)),
]

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
    .filter((c) => c.key != null && !c.fixed)
    .sort((a, b) => order.indexOf(String(a.key)) - order.indexOf(String(b.key)))
  let i = 0
  return columns
    .map((c) => (c.key != null && !c.fixed ? movable[i++] : c))
    .filter((c) => !(c.key != null && hidden.includes(String(c.key))))
}
