import React from 'react'
import { Button } from 'antd'
import { CheckOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import ChatTooltip from './ChatTooltip'
import { useCopyToClipboard } from './useCopyToClipboard'
import styles from '../style.module.scss'

interface MessageActionsProps {
  text: string
  /** Omitted when the answer cannot be regenerated. */
  onRegenerate?: () => void
  regenerateDisabledReason?: string
}

const MessageActions: React.FC<MessageActionsProps> = ({
  text,
  onRegenerate,
  regenerateDisabledReason,
}) => {
  const { copied, copy } = useCopyToClipboard()
  const copyLabel = copied ? 'Скопійовано' : 'Копіювати відповідь'

  return (
    <div className={styles.messageActions}>
      <ChatTooltip title={copyLabel}>
        <Button
          type="text"
          size="small"
          icon={
            copied ? (
              <CheckOutlined className={styles.copiedIcon} />
            ) : (
              <CopyOutlined />
            )
          }
          aria-label={copyLabel}
          onClick={() => void copy(text)}
        />
      </ChatTooltip>
      {(onRegenerate || regenerateDisabledReason) && (
        <ChatTooltip title={regenerateDisabledReason ?? 'Згенерувати ще раз'}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            aria-label="Згенерувати ще раз"
            disabled={!onRegenerate}
            onClick={onRegenerate}
          />
        </ChatTooltip>
      )}
    </div>
  )
}

export default MessageActions
