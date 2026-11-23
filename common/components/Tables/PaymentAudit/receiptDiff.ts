import { RefObject, useEffect } from 'react'
import { alignSequences, repairRuns } from './diffAlign'
import { DiffColors, useDiffColors } from './diffColors'

export type DiffSide = 'before' | 'after'

export type DiffLevel = 'line' | 'word'

const MARK_ATTR = 'data-audit-diff'
const LEVEL_ATTR = 'data-audit-diff-level'
const TEXT_ATTR = 'data-audit-diff-text'
const MAX_DEPTH = 60

const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim()

const subtreeText = (element: Element): string =>
  normalize(element.textContent ?? '')

const directTextNodes = (element: Element): Text[] =>
  Array.from(element.childNodes).filter(
    (node): node is Text =>
      node.nodeType === 3 && normalize(node.textContent ?? '') !== ''
  )

const ownText = (element: Element): string =>
  normalize(
    directTextNodes(element)
      .map((node) => node.textContent ?? '')
      .join(' ')
  )

const elementChildren = (element: Element): HTMLElement[] =>
  Array.from(element.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  )

const signatureOf = (element: Element): string =>
  `${element.tagName}|${element.getAttribute('class') ?? ''}`

const paint = (
  element: HTMLElement,
  side: DiffSide,
  level: DiffLevel,
  color: string
) => {
  element.setAttribute(MARK_ATTR, side)
  element.setAttribute(LEVEL_ATTR, level)
  element.style.backgroundColor = color
}

const paintText = (
  element: HTMLElement,
  side: DiffSide,
  colors: DiffColors
): boolean => {
  const textNodes = directTextNodes(element)
  if (textNodes.length === 0) return false

  textNodes.forEach((node) => {
    const span = element.ownerDocument.createElement('span')
    span.setAttribute(TEXT_ATTR, '')

    span.style.all = 'unset'
    span.style.borderRadius = '2px'
    span.style.setProperty('box-decoration-break', 'clone')
    span.style.setProperty('-webkit-box-decoration-break', 'clone')
    paint(span, side, 'word', colors[side].word)

    element.replaceChild(span, node)
    span.appendChild(node)
  })

  return true
}

const mark = (
  element: HTMLElement,
  side: DiffSide,
  colors: DiffColors,
  level: DiffLevel
) => {
  if (level === 'word' && paintText(element, side, colors)) return
  paint(element, side, level, colors[side][level])
}

export const clearDiffMarks = (root: HTMLElement): void => {
  Array.from(root.querySelectorAll<HTMLElement>(`[${TEXT_ATTR}]`)).forEach(
    (span) => {
      const parent = span.parentNode
      if (!parent) return
      while (span.firstChild) parent.insertBefore(span.firstChild, span)
      parent.removeChild(span)
    }
  )

  const marked: HTMLElement[] = [
    ...(root.hasAttribute(MARK_ATTR) ? [root] : []),
    ...Array.from(root.querySelectorAll<HTMLElement>(`[${MARK_ATTR}]`)),
  ]

  marked.forEach((element) => {
    element.style.backgroundColor = ''
    element.removeAttribute(MARK_ATTR)
    element.removeAttribute(LEVEL_ATTR)
  })
}

const compare = (
  before: HTMLElement,
  after: HTMLElement,
  colors: DiffColors,
  depth: number
): void => {
  if (subtreeText(before) === subtreeText(after)) return

  const beforeChildren = elementChildren(before)
  const afterChildren = elementChildren(after)

  if (
    depth >= MAX_DEPTH ||
    beforeChildren.length === 0 ||
    afterChildren.length === 0
  ) {
    mark(before, 'before', colors, 'word')
    mark(after, 'after', colors, 'word')
    return
  }

  const aligned = repairRuns<HTMLElement>(
    alignSequences(
      beforeChildren,
      afterChildren,
      (element) => `${signatureOf(element)}|${subtreeText(element)}`
    ),
    signatureOf
  )

  aligned.forEach((pair) => {
    if (pair.left && pair.right) {
      compare(pair.left, pair.right, colors, depth + 1)
    } else if (pair.left) {
      mark(pair.left, 'before', colors, 'line')
    } else if (pair.right) {
      mark(pair.right, 'after', colors, 'line')
    }
  })

  const beforeOwn = ownText(before)
  const afterOwn = ownText(after)
  if (beforeOwn !== afterOwn && (beforeOwn || afterOwn)) {
    mark(before, 'before', colors, 'word')
    mark(after, 'after', colors, 'word')
  }
}

export const paintReceiptDiff = (
  before: HTMLElement,
  after: HTMLElement,
  colors: DiffColors
): void => {
  clearDiffMarks(before)
  clearDiffMarks(after)
  compare(before, after, colors, 0)
}

export const useReceiptDiffHighlight = (
  enabled: boolean,
  beforeRef: RefObject<HTMLElement>,
  afterRef: RefObject<HTMLElement>
): void => {
  const colors = useDiffColors()

  useEffect(() => {
    const before = beforeRef.current
    const after = afterRef.current
    if (!before || !after) return

    if (!enabled) {
      clearDiffMarks(before)
      clearDiffMarks(after)
      return
    }

    const options = { childList: true, subtree: true, characterData: true }
    let scheduled = 0

    const run = () => {
      scheduled = 0
      observer.disconnect()
      paintReceiptDiff(before, after, colors)
      observer.observe(before, options)
      observer.observe(after, options)
    }

    const repaint = () => {
      if (scheduled) cancelAnimationFrame(scheduled)
      scheduled = requestAnimationFrame(run)
    }

    const observer = new MutationObserver(repaint)

    repaint()

    return () => {
      observer.disconnect()
      if (scheduled) cancelAnimationFrame(scheduled)
      clearDiffMarks(before)
      clearDiffMarks(after)
    }
  }, [enabled, beforeRef, afterRef, colors])
}
