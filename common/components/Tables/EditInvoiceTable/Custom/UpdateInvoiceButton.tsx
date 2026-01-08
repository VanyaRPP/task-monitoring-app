import { Button, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import React from 'react'

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
  const isVisible =
    editable &&
    type === 'custom' &&
    defaultPrice !== undefined &&
    currentPrice !== defaultPrice

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
