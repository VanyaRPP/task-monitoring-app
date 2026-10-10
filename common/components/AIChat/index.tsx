'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useEffect,
  useState,
  KeyboardEvent,
} from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, type FileUIPart } from 'ai'
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
  CameraOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { useIsAdmin } from '@modules/hooks/useIsAdmin'
import { useAppSelector } from '@modules/store/hooks'
import AddPaymentModal from '@components/AddPaymentModal'
import type { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import AddCostModal from '@components/AddCostModal'
import AddServiceModal from '@components/AddServiceModal'
import RealEstateModal from '@components/UI/RealEstateComponents/RealEstateModal'
import type { ExpenseDraft } from '@common/services/aiAssistant/expenseActions'
import { message } from 'antd'
import {
  DOCUMENT_BATCH_PART,
  type IDocumentBatchPart,
} from '@common/services/aiAssistant/documents/types'
import { toPaymentFormData } from './invoiceDraft'
import BatchCard from './photoImport/BatchCard'
import { shrinkImage } from './photoImport/imageTools'
import {
  IDocumentBatch,
  IImportCardState,
  useDocumentImports,
} from './photoImport/useDocumentImports'
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

const isPhoto = (part: UIMessage['parts'][number]): part is FileUIPart =>
  part.type === 'file' && part.mediaType?.startsWith('image/')

const BATCH_PART_TYPE = `data-${DOCUMENT_BATCH_PART}`

const getBatchIds = (message: UIMessage): string[] =>
  (message.parts ?? [])
    .filter((part) => part.type === BATCH_PART_TYPE)
    .map((part) => (part as { data: IDocumentBatchPart }).data.batchId)

/**
 * Photos never go to /api/chat: the widget reads them itself (see
 * `useDocumentImports`), and the chat model learns what they held from the
 * batch summary. Each resent image would add hundreds of KB to every request.
 */
const withoutPhotos = (messages: UIMessage[]): UIMessage[] =>
  messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      isPhoto(part) ? { type: 'text' as const, text: '[Фото документа]' } : part
    ),
  }))

interface IDocumentBatchesContext {
  batches: Record<string, IDocumentBatch>
  updateCard: (
    batchId: string,
    key: string,
    patch: Partial<IImportCardState>
  ) => void
}

const DocumentBatchesContext = createContext<IDocumentBatchesContext>({
  batches: {},
  updateCard: () => undefined,
})

const chatTransport = new DefaultChatTransport<UIMessage>({
  api: '/api/chat',
  prepareSendMessagesRequest: ({ id, messages, body, trigger, messageId }) => ({
    body: {
      ...body,
      id,
      messages: withoutPhotos(messages),
      trigger,
      messageId,
    },
  }),
})

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { batches, updateCard } = useContext(DocumentBatchesContext)
  const isUser = message.role === 'user'
  const text = getMessageText(message)
  const photos = (message.parts ?? []).filter(isPhoto)
  const batchIds = getBatchIds(message)

  if (!text && photos.length === 0 && batchIds.length === 0) return null

  // The import cards need the full width of the window, not a bubble.
  if (batchIds.length > 0) {
    return (
      <div className={`${styles.messageRow} ${styles.aiRow} ${styles.cardRow}`}>
        <Avatar
          size={24}
          icon={<RobotOutlined />}
          className={styles.aiAvatar}
        />
        <div className={styles.cardColumn}>
          {batchIds.map((batchId) => (
            <BatchCard
              key={batchId}
              batch={batches[batchId]}
              onCardChange={(key, patch) => updateCard(batchId, key, patch)}
            />
          ))}
        </div>
      </div>
    )
  }

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
        {photos.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={index}
            src={photo.url}
            alt="Фото документа"
            className={styles.messagePhoto}
          />
        ))}
        {text && (
          <div className={styles.messageText}>{renderMessageContent(text)}</div>
        )}
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

  const menuOffset = useAppSelector((state) => state.floatButtons.menuOffset)
  const bubbleBottom = 88 + menuOffset
  const windowStyle = {
    '--ai-chat-window-bottom': `${144 + menuOffset}px`,
  } as React.CSSProperties

  const [open, setOpen] = useState<boolean>(false)
  const [showHint, setShowHint] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Invoice draft flow: previewInvoice tool returns a draft that opens the
  // prefilled AddPaymentModal. `handledToolCalls` guards against the stream
  // re-rendering and re-opening the modal for a tool call already handled.
  const [invoiceDraft, setInvoiceDraft] = useState<any>(null)
  const [invoiceExtraLines, setInvoiceExtraLines] = useState<IPaymentField[]>(
    []
  )
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false)
  const handledToolCallsRef = useRef<Set<string>>(new Set())
  // previewExpenses works the same way, with the add-cost form.
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft | null>(null)
  // previewCompany: a new company to check and save.
  const [companyDraft, setCompanyDraft] = useState<any>(null)
  // previewService: a new month's tariffs, or an existing month to edit.
  const [serviceDraft, setServiceDraft] = useState<{
    mode: 'create' | 'edit'
    service: any
  } | null>(null)

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: chatTransport,
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

  // Once a batch is read, its summary goes into the message that stands for
  // it - that text is all the chat model will ever know about the photos.
  const onBatchDone = useCallback(
    (batchId: string, summary: string) =>
      setMessages((prev) =>
        prev.map((message) =>
          getBatchIds(message).includes(batchId)
            ? {
                ...message,
                parts: message.parts.map((part) =>
                  part.type === BATCH_PART_TYPE
                    ? {
                        ...part,
                        data: { ...(part as any).data, summary },
                      }
                    : part
                ),
              }
            : message
        )
      ),
    [setMessages]
  )
  const {
    batches,
    start: startBatch,
    updateCard,
  } = useDocumentImports(onBatchDone)

  // Watch for completed `previewInvoice` / `previewCredit` /
  // `previewExpenses` / `previewService` / `previewCompany` tool calls and
  // open the prefilled payment / cost / service / company modal with their
  // draft. Each toolCallId is handled at most once.
  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts ?? []) {
        const p = part as any
        if (
          // A credit opens the same payment form, as type `credit`.
          (p.type === 'tool-previewInvoice' ||
            p.type === 'tool-previewCredit') &&
          p.state === 'output-available' &&
          p.output?.draft &&
          !handledToolCallsRef.current.has(p.toolCallId)
        ) {
          handledToolCallsRef.current.add(p.toolCallId)
          setInvoiceDraft(toPaymentFormData(p.output.draft))
          setInvoiceExtraLines(p.output.draft.extraLines ?? [])
          setInvoiceModalOpen(true)
        }
        if (
          p.type === 'tool-previewExpenses' &&
          p.state === 'output-available' &&
          p.output?.draft &&
          !handledToolCallsRef.current.has(p.toolCallId)
        ) {
          handledToolCallsRef.current.add(p.toolCallId)
          setExpenseDraft(p.output.draft)
        }
        if (
          p.type === 'tool-previewCompany' &&
          p.state === 'output-available' &&
          p.output?.draft &&
          !handledToolCallsRef.current.has(p.toolCallId)
        ) {
          handledToolCallsRef.current.add(p.toolCallId)
          setCompanyDraft(p.output.draft)
        }
        if (
          p.type === 'tool-previewService' &&
          p.state === 'output-available' &&
          p.output?.draft &&
          !handledToolCallsRef.current.has(p.toolCallId)
        ) {
          handledToolCallsRef.current.add(p.toolCallId)
          setServiceDraft(p.output.draft)
        }
      }
    }
  }, [messages])

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
  }, [open])

  useEffect(() => {
    if (open) setShowHint(false)
  }, [open])

  const handleSend = (): void => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    sendMessage({ text: trimmed })
    setInputValue('')
  }

  /**
   * Photos from the picker, the clipboard or a drop. They need no text: the
   * widget works out what they are and reads them in the background. The
   * photos and their card are added to the chat locally - nothing is sent to
   * the chat model.
   */
  const handleFiles = async (files: File[]): Promise<void> => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) return

    setIsPreparingPhoto(true)
    try {
      const shrunk = await Promise.all(images.map(shrinkImage))
      const batchId = startBatch(
        shrunk.map((photo, index) => ({
          name: images[index].name || `Фото ${index + 1}`,
          url: photo.url,
        }))
      )
      const stamp = Date.now()
      setMessages((prev) => [
        ...prev,
        { id: `photos-${stamp}`, role: 'user', parts: shrunk },
        {
          id: `batch-${stamp}`,
          role: 'assistant',
          parts: [{ type: BATCH_PART_TYPE, data: { batchId } } as any],
        },
      ])
    } catch {
      message.error('Не вдалося відкрити фото. Спробуйте JPG або PNG.')
    } finally {
      setIsPreparingPhoto(false)
    }
  }

  const handlePicked = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? [])
    // Reset so picking the same file again still fires onChange.
    event.target.value = ''
    void handleFiles(files)
  }

  const handlePaste = (event: React.ClipboardEvent): void => {
    const files = Array.from(event.clipboardData?.files ?? [])
    if (!files.some((file) => file.type.startsWith('image/'))) return
    event.preventDefault()
    void handleFiles(files)
  }

  const handleDrop = (event: React.DragEvent): void => {
    event.preventDefault()
    setIsDragging(false)
    void handleFiles(Array.from(event.dataTransfer?.files ?? []))
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
        data-ai-chat
        icon={<RobotOutlined />}
        type="primary"
        tooltip={{ title: 'AI Помічник', placement: 'left' }}
        onClick={() => {
          setOpen(!open)
          setShowHint(false)
        }}
        className={styles.floatButton}
        style={{ insetInlineEnd: 24, bottom: bubbleBottom }}
      />

      {showHint && !open && (
        <div
          data-ai-chat
          className={styles.welcomeHint}
          style={windowStyle}
          onClick={() => setOpen(true)}
        >
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
        <div
          data-ai-chat
          className={`${styles.chatWindow} ${isDragging ? styles.chatDragging : ''}`}
          style={windowStyle}
          onPaste={handlePaste}
          onDragOver={(event) => {
            if (
              !Array.from(event.dataTransfer?.types ?? []).includes('Files')
            ) {
              return
            }
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(event) => {
            // Only when leaving the window, not when crossing its children.
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragging(false)
            }
          }}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className={styles.dropOverlay}>
              Відпустіть, щоб надіслати фото
            </div>
          )}
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
            <DocumentBatchesContext.Provider value={{ batches, updateCard }}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </DocumentBatchesContext.Provider>

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
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              data-testid="ai-chat-photo-input"
              onChange={handlePicked}
            />
            <Button
              type="text"
              icon={<CameraOutlined />}
              title="Надіслати фото документів (можна кілька, або вставити Ctrl+V чи перетягнути у вікно)"
              aria-label="Надіслати фото документів"
              loading={isPreparingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className={styles.photoButton}
            />
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

      {companyDraft && (
        <RealEstateModal
          chosenRealEstate={{
            domain: companyDraft.domain,
            street: companyDraft.street,
          }}
          draft={companyDraft}
          editable
          closeModal={() => setCompanyDraft(null)}
        />
      )}

      {serviceDraft &&
        (serviceDraft.mode === 'edit' ? (
          <AddServiceModal
            currentService={serviceDraft.service}
            serviceActions={{ edit: true, preview: false }}
            closeModal={() => setServiceDraft(null)}
          />
        ) : (
          <AddServiceModal
            draft={serviceDraft.service}
            closeModal={() => setServiceDraft(null)}
          />
        ))}

      {expenseDraft && (
        <AddCostModal
          draft={expenseDraft}
          closeModal={() => setExpenseDraft(null)}
        />
      )}

      {invoiceModalOpen && invoiceDraft && (
        <AddPaymentModal
          paymentData={invoiceDraft}
          extraInvoiceLines={invoiceExtraLines}
          paymentActions={{ edit: false, preview: false }}
          closeModal={(success?: boolean) => {
            setInvoiceModalOpen(false)
            setInvoiceDraft(null)
            if (success) {
              message.success(
                invoiceDraft.type === 'credit'
                  ? 'Оплату успішно створено!'
                  : 'Рахунок успішно створено!'
              )
            }
          }}
        />
      )}
    </>
  )
}

export default AIChat
