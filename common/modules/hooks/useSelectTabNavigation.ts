import { KeyboardEvent as ReactKeyboardEvent, useCallback, useRef } from 'react'

const ARROW_KEYS = {
  next: { key: 'ArrowDown', keyCode: 40 },
  prev: { key: 'ArrowUp', keyCode: 38 },
} as const

const pressArrow = (target: EventTarget, direction: 'next' | 'prev') => {
  const { key, keyCode } = ARROW_KEYS[direction]
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  })

  Object.defineProperties(event, {
    keyCode: { get: () => keyCode },
    which: { get: () => keyCode },
  })
  target.dispatchEvent(event)
}

export interface SelectTabNavigation {
  onOpenChange: (open: boolean) => void
  onKeyDownCapture: (event: ReactKeyboardEvent<HTMLElement>) => void
}

export const useSelectTabNavigation = (): SelectTabNavigation => {
  const isOpenRef = useRef(false)

  const onOpenChange = useCallback((open: boolean) => {
    isOpenRef.current = open
  }, [])

  const onKeyDownCapture = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Tab' || !isOpenRef.current) return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      event.preventDefault()
      event.stopPropagation()
      pressArrow(event.target, event.shiftKey ? 'prev' : 'next')
    },
    []
  )

  return { onOpenChange, onKeyDownCapture }
}
