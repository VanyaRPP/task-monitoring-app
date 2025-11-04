import React, { useMemo, useState, useEffect } from 'react'
import type { FilterDropdownProps } from 'antd/es/table/interface'
import { Tree, Button } from 'antd'

type TreeNode = { text: string; value: string; children?: TreeNode[] }
type Props = FilterDropdownProps & {
  data: TreeNode[]
  onFilterChange?: (keys: string[]) => void
}

const MonthFilterDropdown: React.FC<Props> = ({
  data,
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
      data.map((y) => ({
        key: y.value,
        title: y.text,
        children: (y.children || []).map((c) => ({
          key: c.value,
          title: c.text,
        })),
      })),
    [data]
  )

  // Только месячные ключи (YYYY-month-N)
  const handleCheck = (checkedKeys: any) => {
    const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked || []
    const monthKeys = keys.filter((k) => /^\d{4}-month-\d{1,2}$/.test(String(k)))
    setSelectedKeys?.(monthKeys)
  }

  const handleConfirm = () => {
    const keys = selectedKeys as string[]
    onFilterChange?.(keys)
    confirm?.({ closeDropdown: true })
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ maxHeight: 280, overflow: 'auto', marginBottom: 8 }}>
        <Tree
          checkable
          selectable={false}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          treeData={treeData}
          checkedKeys={selectedKeys as string[]}
          onCheck={handleCheck}
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