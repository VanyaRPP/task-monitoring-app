import React, { useMemo, useState, useEffect } from 'react'
import type { FilterDropdownProps } from 'antd/es/table/interface'
import { Tree, Button } from 'antd'

type TreeNode = { text: string; value: string; children?: TreeNode[] }
type Props = FilterDropdownProps & { data: TreeNode[] }

const DateFilterDropdown: React.FC<Props> = ({
  data,
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => {
    const year2025 = data.find(d => d.value === '2025')
    return year2025 ? [year2025.value] : []
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
  useEffect(() => {
    const year2025 = data.find(d => d.value === '2025')
    if (year2025) {
      setExpandedKeys([year2025.value])
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
          checkedKeys={selectedKeys as string[]}
          onCheck={(keys) => setSelectedKeys(keys as string[])}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <Button
          onClick={() => {
            clearFilters?.()
            const year2025 = data.find(d => d.value === '2025')
            setExpandedKeys(year2025 ? [year2025.value] : [])
          }}
        >
          Скинути
        </Button>
        <Button
          type="primary"
          onClick={() => {
            confirm()
            const year2025 = data.find(d => d.value === '2025')
            setExpandedKeys(year2025 ? [year2025.value] : [])
          }}
        >
          OK
        </Button>
      </div>
    </div>
  )
}

export default DateFilterDropdown
