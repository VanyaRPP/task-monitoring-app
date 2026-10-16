import { useCallback, useEffect, useRef, useState } from 'react'

const COPIED_STATE_MS = 2000

/** `navigator.clipboard` needs a secure context; fall back to execCommand. */
const writeToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied - try the legacy path below.
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

interface IUseCopyToClipboardResult {
  copied: boolean
  copy: (text: string) => Promise<boolean>
}

export const useCopyToClipboard = (): IUseCopyToClipboardResult => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const copy = useCallback(async (text: string) => {
    const ok = await writeToClipboard(text)
    if (ok) {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_STATE_MS)
    }
    return ok
  }, [])

  return { copied, copy }
}
