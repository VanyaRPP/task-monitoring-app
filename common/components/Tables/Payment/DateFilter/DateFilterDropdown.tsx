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
  const currentYear = new Date().getFullYear()
  const currentYearData = data.find((d) => d.value === String(currentYear))
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => {
    return currentYearData ? [currentYearData.value] : []
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
    if (currentYearData) {
      setExpandedKeys([currentYearData.value])
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
            setExpandedKeys(currentYearData ? [currentYearData.value] : [])
          }}
        >
          Скинути
        </Button>
        <Button
          type="primary"
          onClick={() => {
            confirm()
            setExpandedKeys(currentYearData ? [currentYearData.value] : [])
          }}
        >
          OK
        </Button>
      </div>
    </div>
  )
}

export default DateFilterDropdown
