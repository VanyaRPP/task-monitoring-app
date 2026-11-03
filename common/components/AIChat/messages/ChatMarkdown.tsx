import React from 'react'
import Markdown, { type MarkdownToJSX } from 'markdown-to-jsx'
import Link from 'next/link'
import CodeBlock from './CodeBlock'
import styles from '../style.module.scss'

interface AnchorProps {
  href?: string
  title?: string
  children?: React.ReactNode
}

const isInternalHref = (href: string): boolean =>
  href.startsWith('/') && !href.startsWith('//')

const ChatAnchor: React.FC<AnchorProps> = ({ href, title, children }) => {
  // The sanitizer drops javascript:/data: URLs, leaving no href at all.
  if (!href) return <span>{children}</span>
  if (isInternalHref(href)) {
    return (
      <Link href={href} title={title} className={styles.chatLink}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.chatLink}
    >
      {children}
    </a>
  )
}

interface ImageProps {
  src?: string
  alt?: string
}

// Images from model output are not loaded - an arbitrary URL could track the
// viewer. Show them as a link instead.
const ChatImage: React.FC<ImageProps> = ({ src, alt }) => (
  <ChatAnchor href={src}>{alt || src || 'зображення'}</ChatAnchor>
)

const ScrollTable: React.FC<React.HTMLAttributes<HTMLTableElement>> = (
  props
) => (
  // Focusable so a wide table can be scrolled with the keyboard.
  <div
    className={styles.tableScroll}
    tabIndex={0}
    role="region"
    aria-label="Таблиця"
  >
    <table {...props} />
  </div>
)

interface PreProps {
  children?: React.ReactNode
}

/** Fenced blocks arrive as `<pre><code className="lang-x">text</code></pre>`. */
const ChatPre: React.FC<PreProps> = ({ children }) => {
  const code = React.Children.toArray(children)[0]
  if (!React.isValidElement<{ className?: string; children?: unknown }>(code)) {
    return <pre className={styles.codePlain}>{children}</pre>
  }
  const language = code.props.className?.replace(/^lang-/, '') || undefined
  return (
    <CodeBlock
      code={String(code.props.children ?? '').replace(/\n$/, '')}
      language={language}
    />
  )
}

const MARKDOWN_OPTIONS: MarkdownToJSX.Options = {
  // Raw HTML from the model is shown as text, never turned into elements.
  disableParsingRawHTML: true,
  forceBlock: true,
  wrapper: React.Fragment,
  overrides: {
    a: ChatAnchor,
    img: ChatImage,
    pre: ChatPre,
    table: ScrollTable,
  },
}

interface ChatMarkdownProps {
  text: string
}

const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ text }) => (
  <div className={styles.markdown}>
    <Markdown options={MARKDOWN_OPTIONS}>{text}</Markdown>
  </div>
)

// Re-parses only when the text changes (i.e. only the streaming message).
export default React.memo(ChatMarkdown)
