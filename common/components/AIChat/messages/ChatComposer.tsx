import React, { KeyboardEvent } from 'react'
import { Button, Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import cn from 'classnames'
import ChatTooltip from './ChatTooltip'
import styles from '../style.module.scss'

const MAX_ROWS = 5

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isLoading: boolean
  /** Rendered before the text field (e.g. the photo button). */
  leading?: React.ReactNode
}

const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  leading,
}) => {
  const canSend = value.trim().length > 0 && !isLoading

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    // isComposing: Enter that confirms an IME candidate is not a send.
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }
    event.preventDefault()
    if (canSend) onSend()
  }

  return (
    <div className={styles.chatFooter}>
      {leading}
      <Input.TextArea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Запитайте щось..."
        aria-label="Повідомлення AI-помічнику"
        autoSize={{ minRows: 1, maxRows: MAX_ROWS }}
        className={styles.chatInput}
      />
      {isLoading ? (
        <ChatTooltip title="Зупинити генерацію">
          <Button
            type="primary"
            shape="circle"
            aria-label="Зупинити генерацію"
            onClick={onStop}
            className={cn(styles.sendButton, styles.stopButton)}
            icon={<span className={styles.stopIcon} />}
          />
        </ChatTooltip>
      ) : (
        <ChatTooltip
          title={canSend ? 'Надіслати (Enter)' : 'Введіть повідомлення'}
        >
          <Button
            type="primary"
            shape="circle"
            aria-label="Надіслати"
            icon={<SendOutlined />}
            disabled={!canSend}
            onClick={onSend}
            className={styles.sendButton}
          />
        </ChatTooltip>
      )}
    </div>
  )
}

export default ChatComposer
