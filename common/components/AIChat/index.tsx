'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, type FileUIPart } from 'ai'
import { ConfigProvider, FloatButton, Button, Avatar, Typography } from 'antd'
import {
  ArrowDownOutlined,
  FilePdfOutlined,
  PaperClipOutlined,
  RobotOutlined,
  CloseOutlined,
  MinusOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import cn from 'classnames'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useIsAdmin } from '@modules/hooks/useIsAdmin'
import { useAppSelector } from '@modules/store/hooks'
import AddPaymentModal from '@components/AddPaymentModal'
import type { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import AddCostModal from '@components/AddCostModal'
import AddServiceModal from '@components/AddServiceModal'
import RealEstateModal from '@components/UI/RealEstateComponents/RealEstateModal'
import AddStreetModal from '@components/AddStreetModal'
import DomainModal from '@components/UI/DomainsComponents/DomainModal'
import type { ExpenseDraft } from '@common/services/aiAssistant/expenseActions'
import { message } from 'antd'
import {
  DOCUMENT_BATCH_PART,
  type IDocumentBatchPart,
} from '@common/services/aiAssistant/documents/types'
import ResizeHandles from './floatingWindow/ResizeHandles'
import { useFloatingWindow } from './floatingWindow/useFloatingWindow'
import { toPaymentFormData } from './invoiceDraft'
import ChatComposer from './messages/ChatComposer'
import ChatMarkdown from './messages/ChatMarkdown'
import ChatTooltip from './messages/ChatTooltip'
import MessageActions from './messages/MessageActions'
import {
  WELCOME_MESSAGE_ID,
  describeChatError,
  getMessageText,
  isPdfFile,
  isPhoto,
  producedDraft,
} from './messages/messageParts'
import { useChatScroll } from './messages/useChatScroll'
import BatchCard from './photoImport/BatchCard'
import { shrinkImage } from './photoImport/imageTools'
import {
  IDocumentBatch,
  IImportCardState,
  useDocumentImports,
} from './photoImport/useDocumentImports'
import styles from './style.module.scss'

const { Text } = Typography

const REGENERATE_BLOCKED_REASON =
  'Ця відповідь відкрила форму. Щоб не створити запис двічі, поставте нове запитання.'

type RegenerateState = 'none' | 'enabled' | 'blocked'

interface ChatMessageProps {
  message: UIMessage
  showActions: boolean
  regenerate: RegenerateState
  onRegenerate: (messageId: string) => void
}

const BATCH_PART_TYPE = `data-${DOCUMENT_BATCH_PART}`

const getBatchIds = (message: UIMessage): string[] =>
  (message.parts ?? [])
    .filter((part) => part.type === BATCH_PART_TYPE)
    .map((part) => (part as { data: IDocumentBatchPart }).data.batchId)

/**
 * Photos and PDFs never go to /api/chat: the widget reads them itself (see
 * `useDocumentImports`), and the chat model learns what they held from the
 * batch summary. Each resent file would add hundreds of KB to every request.
 */
const withoutPhotos = (messages: UIMessage[]): UIMessage[] =>
  messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      isPhoto(part)
        ? { type: 'text' as const, text: '[Фото документа]' }
        : isPdfFile(part)
          ? { type: 'text' as const, text: '[PDF документа]' }
          : part
    ),
  }))

/** A PDF goes to the server whole (base64 adds a third); the route takes 4 MB. */
const MAX_PDF_BYTES = 2.5 * 1024 * 1024

const isPdf = (file: File): boolean =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

const isSupportedFile = (file: File): boolean =>
  file.type.startsWith('image/') || isPdf(file)

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

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

const AiAvatar: React.FC = () => (
  <Avatar size={20} icon={<RobotOutlined />} className={styles.aiAvatar} />
)

// Memoized so window drag/resize/maximize re-renders skip the message list.
const ChatMessage: React.FC<ChatMessageProps> = React.memo(
  ({ message, showActions, regenerate, onRegenerate }) => {
    const { batches, updateCard } = useContext(DocumentBatchesContext)
    const isUser = message.role === 'user'
    const text = getMessageText(message)
    const photos = (message.parts ?? []).filter(isPhoto)
    const pdfs = (message.parts ?? []).filter(isPdfFile)
    const batchIds = getBatchIds(message)

    if (
      !text &&
      photos.length === 0 &&
      pdfs.length === 0 &&
      batchIds.length === 0
    ) {
      return null
    }

    // The import cards need the full width of the window, not a bubble.
    if (batchIds.length > 0) {
      return (
        <div className={cn(styles.messageRow, styles.aiRow)}>
          <AiAvatar />
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

    if (isUser) {
      return (
        <div className={cn(styles.messageRow, styles.userRow)}>
          <div className={cn(styles.messageBubble, styles.userBubble)}>
            {photos.map((photo, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={photo.url}
                alt="Фото документа"
                className={styles.messagePhoto}
              />
            ))}
            {pdfs.map((pdf, index) => (
              <div key={`pdf-${index}`} className={styles.messageFile}>
                <FilePdfOutlined /> {pdf.filename ?? 'PDF'}
              </div>
            ))}
            {/* What the user typed is shown as typed, not as Markdown. */}
            {text && <div className={styles.plainText}>{text}</div>}
          </div>
        </div>
      )
    }

    return (
      <div className={cn(styles.messageRow, styles.aiRow)}>
        <AiAvatar />
        <div className={styles.aiColumn}>
          <div className={cn(styles.messageBubble, styles.aiBubble)}>
            <ChatMarkdown text={text} />
          </div>
          {showActions && (
            <MessageActions
              text={text}
              onRegenerate={
                regenerate === 'enabled'
                  ? () => onRegenerate(message.id)
                  : undefined
              }
              regenerateDisabledReason={
                regenerate === 'blocked' ? REGENERATE_BLOCKED_REASON : undefined
              }
            />
          )}
        </div>
      </div>
    )
  }
)
ChatMessage.displayName = 'ChatMessage'

const TypingIndicator: React.FC = () => (
  <div className={cn(styles.messageRow, styles.aiRow)}>
    <AiAvatar />
    <div
      className={cn(styles.messageBubble, styles.aiBubble, styles.typing)}
      role="status"
    >
      <span className={styles.typingDots} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      Генерую відповідь…
    </div>
  </div>
)

interface HeaderButtonProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  label,
  icon,
  onClick,
}) => (
  <ChatTooltip title={label} placement="bottom">
    <Button
      type="text"
      size="small"
      icon={icon}
      aria-label={label}
      onClick={onClick}
    />
  </ChatTooltip>
)

const AIChat: React.FC = () => {
  // Gate: the assistant is currently available to admins only (matches the
  // server-side check in /api/chat). Non-admins never see the widget.
  const { isAdmin } = useIsAdmin()

  const menuOffset = useAppSelector((state) => state.floatButtons.menuOffset)
  const bubbleBottom = 88 + menuOffset
  const windowStyle = {
    '--ai-chat-window-bottom': `${144 + menuOffset}px`,
  } as React.CSSProperties

  const { data: currentUser } = useGetCurrentUserQuery()
  const floating = useFloatingWindow({
    userKey: currentUser?._id ? String(currentUser._id) : undefined,
    bottomOffset: 144 + menuOffset,
  })

  const [open, setOpen] = useState<boolean>(false)
  // Minimized keeps a marker on the open button; closed does not.
  const [minimized, setMinimized] = useState<boolean>(false)
  const [showHint, setShowHint] = useState<boolean>(false)
  // Lives here, not in the window, so closing/moving the window keeps it.
  const [inputValue, setInputValue] = useState<string>('')
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
  // Set when the draft's lines are final (named rows repriced or the rest
  // dropped), so the form must not re-seed them from the tariffs.
  const [invoiceLines, setInvoiceLines] = useState<IPaymentField[]>()
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false)
  const handledToolCallsRef = useRef<Set<string>>(new Set())
  // previewExpenses works the same way, with the add-cost form.
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft | null>(null)
  // previewCompany: a new company to check and save.
  const [companyDraft, setCompanyDraft] = useState<any>(null)
  // previewStreet: a new address for a domain.
  const [streetDraft, setStreetDraft] = useState<any>(null)
  // previewDomain: a new service provider.
  const [domainDraft, setDomainDraft] = useState<any>(null)
  // previewService: a new month's tariffs, or an existing month to edit.
  const [serviceDraft, setServiceDraft] = useState<{
    mode: 'create' | 'edit'
    service: any
  } | null>(null)

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    status,
    error,
  } = useChat({
    transport: chatTransport,
    messages: [
      {
        id: WELCOME_MESSAGE_ID,
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

  // warn, not error: in dev Next's overlay treats `console.error(_, Error)` as
  // an unhandled runtime error, though the chat already shows it with Retry.
  useEffect(() => {
    if (error) {
      console.warn('AIChat Error:', error.message)
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
  const batchesContext = useMemo(
    () => ({ batches, updateCard }),
    [batches, updateCard]
  )

  // Watch for completed `previewInvoice` / `previewCredit` /
  // `previewExpenses` / `previewService` / `previewCompany` /
  // `previewStreet` / `previewDomain` tool calls and open the prefilled
  // payment / cost / service / company / street / domain modal with their
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
          setInvoiceLines(
            p.output.draft.replaceLines ? p.output.draft.invoice : undefined
          )
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
          p.type === 'tool-previewStreet' &&
          p.state === 'output-available' &&
          p.output?.draft &&
          !handledToolCallsRef.current.has(p.toolCallId)
        ) {
          handledToolCallsRef.current.add(p.toolCallId)
          setStreetDraft(p.output.draft)
        }
        if (
          p.type === 'tool-previewDomain' &&
          p.state === 'output-available' &&
          p.output?.draft &&
          !handledToolCallsRef.current.has(p.toolCallId)
        ) {
          handledToolCallsRef.current.add(p.toolCallId)
          setDomainDraft(p.output.draft)
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
  const lastMessage = messages[messages.length - 1]
  // Tool calls stream before any text, and an empty answer renders nothing.
  const showTyping =
    isLoading &&
    (lastMessage?.role === 'user' ||
      (lastMessage?.role === 'assistant' && !getMessageText(lastMessage)))
  // Only the latest answer can be regenerated: an older one would drop
  // everything said after it.
  const regenerableId =
    !isLoading &&
    lastMessage?.role === 'assistant' &&
    lastMessage.id !== WELCOME_MESSAGE_ID &&
    getBatchIds(lastMessage).length === 0
      ? lastMessage.id
      : undefined

  const scroll = useChatScroll({ enabled: open, contentKey: messages })

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
    scroll.scrollToBottom()
  }

  const { scrollToBottom } = scroll
  const handleRegenerate = useCallback(
    (messageId: string) => {
      scrollToBottom()
      void regenerate({ messageId })
    },
    [regenerate, scrollToBottom]
  )

  // A failed request leaves the history as it was (plus any partial answer,
  // which regenerate replaces), so retrying is a regenerate.
  const handleRetry = (): void => {
    scrollToBottom()
    void regenerate()
  }

  /**
   * Photos and PDFs from the picker, the clipboard or a drop. They need no
   * text: the widget works out what they are and reads them in the
   * background. The files and their card are added to the chat locally -
   * nothing is sent to the chat model.
   */
  const handleFiles = async (files: File[]): Promise<void> => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    const pdfs = files.filter(isPdf)
    if (images.length === 0 && pdfs.length === 0) return

    const tooBig = pdfs.filter(({ size }) => size > MAX_PDF_BYTES)
    if (tooBig.length > 0) {
      message.error(
        `PDF завеликий (до 2,5 МБ): ${tooBig.map(({ name }) => name).join(', ')}`
      )
      return
    }

    setIsPreparingPhoto(true)
    try {
      const shrunk = await Promise.all(images.map(shrinkImage))
      const pdfParts: FileUIPart[] = await Promise.all(
        pdfs.map(async (pdf) => ({
          type: 'file' as const,
          mediaType: 'application/pdf',
          filename: pdf.name,
          url: await readAsDataUrl(pdf),
        }))
      )
      const batchId = startBatch([
        ...shrunk.map((photo, index) => ({
          name: images[index].name || `Фото ${index + 1}`,
          url: photo.url,
          kind: 'photo' as const,
        })),
        ...pdfParts.map((pdf, index) => ({
          name: pdf.filename || `PDF ${index + 1}`,
          url: pdf.url,
          kind: 'pdf' as const,
        })),
      ])
      const stamp = Date.now()
      setMessages((prev) => [
        ...prev,
        {
          id: `photos-${stamp}`,
          role: 'user',
          parts: [...shrunk, ...pdfParts],
        },
        {
          id: `batch-${stamp}`,
          role: 'assistant',
          parts: [{ type: BATCH_PART_TYPE, data: { batchId } } as any],
        },
      ])
      scrollToBottom()
    } catch {
      message.error(
        'Не вдалося відкрити файл. Надішліть фото (JPG, PNG) або PDF.'
      )
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
    if (!files.some(isSupportedFile)) return
    event.preventDefault()
    void handleFiles(files)
  }

  const handleDrop = (event: React.DragEvent): void => {
    event.preventDefault()
    setIsDragging(false)
    void handleFiles(Array.from(event.dataTransfer?.files ?? []))
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
        badge={minimized ? { dot: true } : undefined}
        aria-label="AI Помічник"
        onClick={() => {
          setOpen(!open)
          setMinimized(false)
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
          ref={floating.windowRef}
          role="dialog"
          aria-label="AI Помічник"
          className={cn(styles.chatWindow, {
            [styles.chatDragging]: isDragging,
            [styles.floatingWindow]: floating.isFloating,
            [styles.maximizedWindow]: floating.isMaximized,
          })}
          style={{ ...windowStyle, ...floating.style }}
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
              Відпустіть, щоб надіслати фото чи PDF
            </div>
          )}
          {floating.isFloating && !floating.isMaximized && (
            <ResizeHandles onResizePointerDown={floating.onResizePointerDown} />
          )}
          <div
            className={cn(styles.chatHeader, {
              [styles.draggableHeader]:
                floating.isFloating && !floating.isMaximized,
            })}
            data-testid="ai-chat-header"
            onPointerDown={floating.onHeaderPointerDown}
            onDoubleClick={floating.onHeaderDoubleClick}
          >
            <div className={styles.headerTitle}>
              <Avatar
                size={22}
                icon={<RobotOutlined />}
                className={styles.headerAvatar}
              />
              <Text strong ellipsis className={styles.headerText}>
                AI Помічник
              </Text>
            </div>
            <div className={styles.headerControls}>
              {floating.isFloating && (
                <>
                  <HeaderButton
                    label="Стандартний розмір і позиція"
                    icon={<UndoOutlined />}
                    onClick={floating.reset}
                  />
                  <HeaderButton
                    label={floating.isMaximized ? 'Відновити' : 'Розгорнути'}
                    icon={
                      floating.isMaximized ? (
                        <FullscreenExitOutlined />
                      ) : (
                        <FullscreenOutlined />
                      )
                    }
                    onClick={floating.toggleMaximize}
                  />
                </>
              )}
              <HeaderButton
                label="Згорнути"
                icon={<MinusOutlined />}
                onClick={() => {
                  setOpen(false)
                  setMinimized(true)
                }}
              />
              <HeaderButton
                label="Закрити"
                icon={<CloseOutlined />}
                onClick={() => {
                  setOpen(false)
                  setMinimized(false)
                }}
              />
            </div>
          </div>

          <div className={styles.messagesArea}>
            <div
              ref={scroll.containerRef}
              className={styles.messagesContainer}
              data-testid="ai-chat-messages"
              // Focusable so the history scrolls with arrows/PageUp/PageDown.
              tabIndex={0}
              role="region"
              aria-label="Повідомлення чату"
              onScroll={scroll.onScroll}
            >
              <div ref={scroll.contentRef} className={styles.messagesContent}>
                <DocumentBatchesContext.Provider value={batchesContext}>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      showActions={
                        message.id !== WELCOME_MESSAGE_ID &&
                        !(isLoading && message === lastMessage)
                      }
                      regenerate={
                        message.id !== regenerableId
                          ? 'none'
                          : producedDraft(message)
                            ? 'blocked'
                            : 'enabled'
                      }
                      onRegenerate={handleRegenerate}
                    />
                  ))}
                </DocumentBatchesContext.Provider>

                {showTyping && <TypingIndicator />}

                {error && !isLoading && (
                  <div className={styles.errorMessage} role="alert">
                    <Text type="danger">{describeChatError(error)}</Text>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleRetry}
                    >
                      Повторити
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {scroll.isAwayFromBottom && (
              <ChatTooltip title="До останнього повідомлення" placement="left">
                <Button
                  shape="circle"
                  icon={<ArrowDownOutlined />}
                  aria-label="До останнього повідомлення"
                  className={styles.scrollToBottom}
                  onClick={() => scroll.scrollToBottom('smooth')}
                />
              </ChatTooltip>
            )}
          </div>

          <ChatComposer
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onStop={() => void stop()}
            isLoading={isLoading}
            leading={
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  hidden
                  data-testid="ai-chat-photo-input"
                  onChange={handlePicked}
                />
                <ChatTooltip title="Надіслати фото чи PDF документів (можна кілька, або вставити Ctrl+V чи перетягнути у вікно)">
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    aria-label="Надіслати фото чи PDF документів"
                    loading={isPreparingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    className={styles.photoButton}
                  />
                </ChatTooltip>
              </>
            }
          />
        </div>
      )}

      {/* The chat window sits above antd's default popup layer (1000), so
          the modals it opens (and their dropdowns) must go higher still. */}
      <ConfigProvider theme={{ token: { zIndexPopupBase: 1100 } }}>
        {domainDraft && (
          <DomainModal
            currentDomain={undefined}
            draft={domainDraft}
            editable
            closeModal={() => setDomainDraft(null)}
          />
        )}

        {streetDraft && (
          <AddStreetModal
            draft={streetDraft}
            closeModal={() => setStreetDraft(null)}
          />
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
            invoiceLines={invoiceLines}
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
      </ConfigProvider>
    </>
  )
}

export default AIChat
