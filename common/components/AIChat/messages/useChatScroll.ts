import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type UIEvent,
} from 'react'

/** Within this distance of the end the chat counts as "at the bottom". */
export const NEAR_BOTTOM_PX = 48

interface IScrollAnchor {
  element: HTMLElement
  /** Element top minus scrollTop when it was recorded. */
  offset: number
}

interface IUseChatScrollOptions {
  /** The window is open, so the refs are attached. */
  enabled: boolean
  /** Changes whenever the message list does (new message, streamed text). */
  contentKey: unknown
}

interface IUseChatScrollResult {
  containerRef: RefObject<HTMLDivElement>
  contentRef: RefObject<HTMLDivElement>
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  /** The user scrolled up into the history. */
  isAwayFromBottom: boolean
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

const isNearBottom = (element: HTMLElement): boolean =>
  element.scrollHeight - element.scrollTop - element.clientHeight <=
  NEAR_BOTTOM_PX

/** The first message that is at least partly visible. */
const findAnchor = (
  container: HTMLElement,
  content: HTMLElement
): IScrollAnchor | null => {
  for (const child of Array.from(content.children) as HTMLElement[]) {
    if (child.offsetTop + child.offsetHeight > container.scrollTop) {
      return { element: child, offset: child.offsetTop - container.scrollTop }
    }
  }
  return null
}

/**
 * Follows new messages only while the user is at the bottom; otherwise their
 * place in the history is kept, including across window resizes (the first
 * visible message stays where it was).
 */
export const useChatScroll = ({
  enabled,
  contentKey,
}: IUseChatScrollOptions): IUseChatScrollResult => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const anchorRef = useRef<IScrollAnchor | null>(null)
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current
    stickRef.current = true
    setIsAwayFromBottom(false)
    if (!container) return
    if (behavior === 'smooth' && typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget
    const atBottom = isNearBottom(container)
    stickRef.current = atBottom
    setIsAwayFromBottom(!atBottom)
    anchorRef.current = contentRef.current
      ? findAnchor(container, contentRef.current)
      : null
  }, [])

  const keepPosition = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (stickRef.current) {
      container.scrollTop = container.scrollHeight
      return
    }
    const anchor = anchorRef.current
    if (anchor?.element.isConnected) {
      container.scrollTop = anchor.element.offsetTop - anchor.offset
    }
  }, [])

  // Opening the window starts at the latest message.
  useLayoutEffect(() => {
    if (enabled) scrollToBottom()
  }, [enabled, scrollToBottom])

  useLayoutEffect(() => {
    if (enabled) keepPosition()
  }, [enabled, contentKey, keepPosition])

  // Window resize/maximize and content that grows on its own (photo cards,
  // images loading) do not change `contentKey`.
  useEffect(() => {
    if (!enabled || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => keepPosition())
    if (containerRef.current) observer.observe(containerRef.current)
    if (contentRef.current) observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [enabled, keepPosition])

  return {
    containerRef,
    contentRef,
    onScroll,
    isAwayFromBottom,
    scrollToBottom,
  }
}
