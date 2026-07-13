'use client'

import React, { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import {
  FloatButton,
  Input,
  Button,
  Avatar,
  Typography,
  Space,
  Spin,
} from 'antd'
import {
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { useIsAdmin } from '@modules/hooks/useIsAdmin'
import styles from './style.module.scss'

const { Text } = Typography

interface ChatMessageProps {
  message: UIMessage
}

/**
 * Simple parser to render Markdown links [Text](/path) as Next.js Links
 * and handle recommendation blocks.
 */
const renderMessageContent = (content: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = content.split(linkRegex)
  const elements = []

  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      const text = parts[i]
      if (text) {
        if (text.trim().startsWith('>')) {
          elements.push(
            <div key={`quote-${i}`} className={styles.recommendationBlock}>
              {text.replace(/^>\s*/, '')}
            </div>
          )
        } else {
          elements.push(<span key={`text-${i}`}>{text}</span>)
        }
      }
    } else if (i % 3 === 1) {
      const linkText = parts[i]
      const linkUrl = parts[i + 1]
      elements.push(
        <Link key={`link-${i}`} href={linkUrl} className={styles.chatLink}>
          {linkText}
        </Link>
      )
      i++
    }
  }

  return elements
}

const getMessageText = (message: UIMessage): string => {
  if (message.parts && message.parts.length > 0) {
    return message.parts
      .filter(
        (part): part is { type: 'text'; text: string } => part.type === 'text'
      )
      .map((part) => part.text)
      .join('')
  }
  return ''
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const text = getMessageText(message)

  if (!text) return null

  return (
    <div
      className={`${styles.messageRow} ${isUser ? styles.userRow : styles.aiRow}`}
    >
      {!isUser && (
        <Avatar
          size={24}
          icon={<RobotOutlined />}
          className={styles.aiAvatar}
        />
      )}
      <div
        className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.aiBubble}`}
      >
        <div className={styles.messageText}>{renderMessageContent(text)}</div>
      </div>
      {isUser && (
        <Avatar
          size={24}
          icon={<UserOutlined />}
          className={styles.userAvatar}
        />
      )}
    </div>
  )
}

const AIChat: React.FC = () => {
  // Gate: the assistant is currently available to admins only (matches the
  // server-side check in /api/chat). Non-admins never see the widget.
  const { isAdmin } = useIsAdmin()

  const [open, setOpen] = useState<boolean>(false)
  const [showHint, setShowHint] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Привіт! Я твій гід по E-ORENDA. Чим можу допомогти?',
          },
        ],
      },
    ],
  })

  useEffect(() => {
    if (error) {
      console.error('AIChat Error:', error)
    }
  }, [error])

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Hint effect: show after 1s, hide after 5s more
  useEffect(() => {
    const showTimer = setTimeout(() => {
      if (!open) {
        setShowHint(true)
        // Hide after 5 seconds of showing
        setTimeout(() => setShowHint(false), 5000)
      }
    }, 1000)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (open) setShowHint(false)
  }, [open])

  const handleSend = (): void => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    sendMessage({ text: trimmed })
    setInputValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSend()
    }
  }

  // Hidden for non-admins. Placed after all hooks so the Rules of Hooks hold.
  if (!isAdmin) return null

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        tooltip={{ title: 'AI Помічник', placement: 'left' }}
        onClick={() => {
          setOpen(!open)
          setShowHint(false)
        }}
        className={styles.floatButton}
        style={{ insetInlineEnd: 24, bottom: 88 }}
      />

      {showHint && !open && (
        <div className={styles.welcomeHint} onClick={() => setOpen(true)}>
          <div className={styles.hintContent}>
            Якщо потрібна допомога натискайте на мене
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ fontSize: '10px' }} />}
              onClick={(e) => {
                e.stopPropagation()
                setShowHint(false)
              }}
              className={styles.hintClose}
            />
          </div>
          <div className={styles.hintArrow} />
        </div>
      )}

      {open && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <Space>
              <Avatar
                size={24}
                icon={<RobotOutlined />}
                className={styles.aiAvatar}
              />
              <Text strong style={{ color: 'white' }}>
                AI Помічник
              </Text>
            </Space>
            <Button
              type="text"
              icon={<CloseOutlined style={{ color: 'white' }} />}
              onClick={() => setOpen(false)}
              size="small"
            />
          </div>

          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading &&
              (messages[messages.length - 1]?.role as string) === 'user' && (
                <div className={`${styles.messageRow} ${styles.aiRow}`}>
                  <Avatar
                    size={24}
                    icon={<RobotOutlined />}
                    className={styles.aiAvatar}
                  />
                  <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                    <Spin size="small" />
                  </div>
                </div>
              )}

            {error && (
              <div className={styles.errorMessage}>
                <Text type="danger" style={{ fontSize: '12px' }}>
                  Помилка з&apos;єднання. Спробуйте ще раз.
                </Text>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chatFooter}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Запитайте щось..."
              disabled={isLoading}
              className={styles.chatInput}
              suffix={
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={isLoading}
                  disabled={!inputValue.trim() || isLoading}
                  size="small"
                  shape="circle"
                  onClick={handleSend}
                />
              }
            />
          </div>
        </div>
      )}
    </>
  )
}

export default AIChat
