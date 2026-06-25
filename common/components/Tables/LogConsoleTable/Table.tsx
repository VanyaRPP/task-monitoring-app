'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Typography,
  Flex,
  Space,
  Tooltip,
} from 'antd'
import {
  ClearOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography
const { RangePicker } = DatePicker

type LogLevel = 'info' | 'warning' | 'error' | 'success' | 'debug'

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  user: string
  action: string
  ip: string
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '2025-05-25 10:01:02',
    level: 'success',
    user: 'admin@example.com',
    action: 'LOGIN',
    ip: '192.168.1.10',
  },
  {
    id: '2',
    timestamp: '2025-05-25 10:02:15',
    level: 'info',
    user: 'ivan@example.com',
    action: 'VIEW_PAGE',
    ip: '10.0.0.5',
  },
  {
    id: '3',
    timestamp: '2025-05-25 10:03:44',
    level: 'warning',
    user: 'olena@example.com',
    action: 'EDIT_USER',
    ip: '172.16.0.3',
  },
  {
    id: '4',
    timestamp: '2025-05-25 10:04:10',
    level: 'error',
    user: 'test@example.com',
    action: 'LOGIN_FAILED',
    ip: '203.0.113.42',
  },
  {
    id: '5',
    timestamp: '2025-05-25 10:05:33',
    level: 'info',
    user: 'admin@example.com',
    action: 'CREATE_USER',
    ip: '192.168.1.10',
  },
  {
    id: '6',
    timestamp: '2025-05-25 10:06:55',
    level: 'success',
    user: 'petro@example.com',
    action: 'LOGIN',
    ip: '10.0.0.22',
  },
]

const LEVEL_CONFIG: Record<
  LogLevel,
  { color: string; label: string; ansiColor: string }
> = {
  success: { color: 'success', label: 'SUCCESS', ansiColor: '#52c41a' },
  info: { color: 'processing', label: 'INFO', ansiColor: '#1677ff' },
  warning: { color: 'warning', label: 'WARN', ansiColor: '#faad14' },
  error: { color: 'error', label: 'ERROR', ansiColor: '#ff4d4f' },
  debug: { color: 'default', label: 'DEBUG', ansiColor: '#8c8c8c' },
}

export const LogsConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [isLive, setIsLive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLive) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, isLive])

  const filtered = logs.filter((log) => {
    const matchLevel = levelFilter === 'all' || log.level === levelFilter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.ip.includes(q)
    return matchLevel && matchSearch
  })

  const handleClear = () => setLogs([])

  const handleDownload = () => {
    const content = filtered
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.user} — ${l.action}: (${l.ip})`
      )
      .join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${dayjs().format('YYYY-MM-DD_HH-mm')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Flex gap={8} wrap="wrap" align="center">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Пошук"
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Select
          value={levelFilter}
          onChange={setLevelFilter}
          style={{ width: 140 }}
          options={[
            { value: 'all', label: 'Всі рівні' },
            { value: 'success', label: 'SUCCESS' },
            { value: 'info', label: 'INFO' },
            { value: 'warning', label: 'WARN' },
            { value: 'error', label: 'ERROR' },
            { value: 'debug', label: 'DEBUG' },
          ]}
        />
        <Flex gap={8} style={{ marginLeft: 'auto' }}>
          <Tooltip
            title={isLive ? 'Зупинити live' : 'Увімкнути live'}
          ></Tooltip>
          <Tooltip title="Оновити">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setLogs(MOCK_LOGS)}
            />
          </Tooltip>
          <Tooltip title="Очистити консоль">
            <Button icon={<ClearOutlined />} onClick={handleClear} />
          </Tooltip>
          <Tooltip title="Завантажити логи">
            <Button icon={<DownloadOutlined />} onClick={handleDownload} />
          </Tooltip>
        </Flex>
      </Flex>

      <Flex gap={8} wrap="wrap">
        {(['success', 'info', 'warning', 'error', 'debug'] as LogLevel[]).map(
          (lvl) => {
            const count = logs.filter((l) => l.level === lvl).length
            const { color, label } = LEVEL_CONFIG[lvl]
            return (
              <Tag
                key={lvl}
                color={color}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() =>
                  setLevelFilter(lvl === levelFilter ? 'all' : lvl)
                }
              >
                {label}: {count}
              </Tag>
            )
          }
        )}
        <Text
          type="secondary"
          style={{ fontSize: 12, marginLeft: 'auto', alignSelf: 'center' }}
        >
          Показано {filtered.length} з {logs.length} записів
        </Text>
      </Flex>

      <div
        style={{
          background: '#0d1117',
          padding: '12px',
          fontSize: 13,
          lineHeight: '22px',
          border: '1px solid #30363d',
          borderRadius: 8,
        }}
      >
        {filtered.length === 0 ? (
          <Flex justify="center" align="center" style={{ height: '100%' }}>
            <Text style={{ color: '#484f58' }}>Логів не знайдено</Text>
          </Flex>
        ) : (
          filtered.map((log, idx) => {
            const { ansiColor, label } = LEVEL_CONFIG[log.level]
            const isEven = idx % 2 === 0
            return (
              <div
                key={log.id}
                style={{
                  padding: '3px 16px',
                  background: isEven ? 'transparent' : 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = isEven
                    ? 'transparent'
                    : 'rgba(255,255,255,0.02)')
                }
              >
                <span
                  style={{
                    color: '#484f58',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {log.timestamp}
                </span>

                <span
                  style={{
                    color: ansiColor,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    width: 56,
                    display: 'inline-block',
                  }}
                >
                  [{label}]
                </span>

                <span
                  style={{
                    color: '#79c0ff',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: 160,
                  }}
                >
                  {log.user}
                </span>
                <span
                  style={{
                    color: '#ffa657',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: 120,
                  }}
                >
                  {log.action}
                </span>

                <span
                  style={{
                    color: '#484f58',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginLeft: 'auto',
                  }}
                >
                  {log.ip}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </Space>
  )
}
