import React from 'react'
import { Button } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
// The CJS light build: only the registered languages ship, and Jest can load
// it without transforming ESM.
import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/light'
import bash from 'react-syntax-highlighter/dist/cjs/languages/hljs/bash'
import css from 'react-syntax-highlighter/dist/cjs/languages/hljs/css'
import javascript from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/cjs/languages/hljs/sql'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript'
import xml from 'react-syntax-highlighter/dist/cjs/languages/hljs/xml'
import yaml from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml'
import codeTheme from 'react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-dark'
import ChatTooltip from './ChatTooltip'
import { useCopyToClipboard } from './useCopyToClipboard'
import styles from '../style.module.scss'

const LANGUAGES: Record<string, unknown> = {
  bash,
  css,
  javascript,
  json,
  python,
  sql,
  typescript,
  xml,
  yaml,
}
Object.entries(LANGUAGES).forEach(([name, language]) =>
  SyntaxHighlighter.registerLanguage(name, language)
)

const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  sh: 'bash',
  shell: 'bash',
  html: 'xml',
  yml: 'yaml',
  py: 'python',
}

export const resolveLanguage = (raw?: string): string | undefined => {
  const name = raw?.toLowerCase()
  if (!name) return undefined
  const resolved = ALIASES[name] ?? name
  return resolved in LANGUAGES ? resolved : undefined
}

interface CodeBlockProps {
  code: string
  language?: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const { copied, copy } = useCopyToClipboard()
  const resolved = resolveLanguage(language)

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBlockHeader}>
        <span>{language || 'code'}</span>
        <ChatTooltip title={copied ? 'Скопійовано' : 'Копіювати код'}>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            aria-label={copied ? 'Скопійовано' : 'Копіювати код'}
            onClick={() => void copy(code)}
          />
        </ChatTooltip>
      </div>
      {resolved ? (
        <SyntaxHighlighter
          language={resolved}
          style={codeTheme}
          customStyle={{ margin: 0, padding: '8px 10px', background: 'none' }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className={styles.codePlain}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

export default CodeBlock
