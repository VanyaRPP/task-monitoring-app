import React, { useMemo, useState, useEffect } from 'react'
import type { FilterDropdownProps } from 'antd/es/table/interface'
import { Tree, Button } from 'antd'

type TreeNode = { text: string; value: string; children?: TreeNode[] }
type Props = FilterDropdownProps & {
  data: TreeNode[]
  onFilterChange?: (keys: string[]) => void
}

const MonthFilterDropdown: React.FC<Props> = ({
  data = [],
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  onFilterChange,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => {
    const firstYear = data[0]?.value
    return firstYear ? [firstYear] : []
  })

  const treeData = useMemo(
    () =>
      (data || []).map((y) => ({
        key: y.value,
        title: y.text,
        children: (y.children || []).map((c) => ({
          key: c.value,
          title: c.text,
        })),
      })),
    [data]
  )

  const isAcceptableKey = (k: unknown) =>
    typeof k === 'string' && /^\d{4}-(month|quarter)-\d{1,2}$/.test(k)

  const handleCheck = (checked: any) => {
    const keysArr: string[] = Array.isArray(checked)
      ? checked
      : Array.isArray(checked?.checked)
      ? checked.checked
      : []

    const filtered = keysArr.filter((k) => isAcceptableKey(k))
    setSelectedKeys?.(filtered)
  }

  const handleConfirm = () => {
    const keys = (selectedKeys || []).filter((k) => isAcceptableKey(k))
    onFilterChange?.(keys as string[])
    confirm?.({ closeDropdown: true })
  }

  const handleClear = () => {
    setSelectedKeys?.([])
    clearFilters?.()
    onFilterChange?.([])
    const firstYear = data[0]?.value
    setExpandedKeys(firstYear ? [firstYear] : [])
  }

  useEffect(() => {
    if (!expandedKeys.length && data.length) {
      const firstYear = data[0]?.value
      if (firstYear) setExpandedKeys([firstYear])
    }
  }, [data])

  return (
    <div style={{ padding: 8 }}>
      <div style={{ maxHeight: 280, overflow: 'auto', marginBottom: 8 }}>
        <Tree
          checkable
          selectable={false}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          treeData={treeData}
          checkedKeys={(selectedKeys || []).filter((k) => isAcceptableKey(k))}
          onCheck={handleCheck}
          checkStrictly={false}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <Button
          onClick={() => {
            clearFilters?.()
            setSelectedKeys?.([])
            const firstYear = data[0]?.value
            setExpandedKeys(firstYear ? [firstYear] : [])
          }}
        >
          Скинути
        </Button>
        <Button type="primary" onClick={handleConfirm}>
          OK
        </Button>
      </div>
    </div>
  )
}

export default MonthFilterDropdown