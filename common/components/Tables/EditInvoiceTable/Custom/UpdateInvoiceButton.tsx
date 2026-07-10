import { Button, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import React from 'react'

const normalizeComparableValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? value : value
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(+value)
  ) {
    return +value
  }

  return value
}

interface UpdateInvoiceButtonProps {
  currentPrice?: number
  defaultPrice?: number
  onRestore: () => void
  editable?: boolean
  type?: string
  disabled?: boolean
}

export const UpdateInvoiceButton: React.FC<UpdateInvoiceButtonProps> = ({
  currentPrice,
  defaultPrice,
  onRestore,
  editable,
  type,
  disabled,
}) => {
  const normalizedCurrentPrice = normalizeComparableValue(currentPrice)
  const normalizedDefaultPrice = normalizeComparableValue(defaultPrice)

  const isVisible =
    editable &&
    type === 'custom' &&
    defaultPrice !== undefined &&
    normalizedCurrentPrice !== normalizedDefaultPrice

  if (!isVisible) return null

  return (
    <Tooltip title="Відновити значення">
      <Button
        icon={<ReloadOutlined />}
        onClick={onRestore}
        disabled={disabled}
        size="small"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 28,
          width: 28,
          padding: 0,
          borderRadius: 4,
        }}
      />
    </Tooltip>
  )
}
