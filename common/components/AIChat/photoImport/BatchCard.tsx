import React, { useEffect, useState } from 'react'
import { Spin, Typography } from 'antd'
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  QuestionOutlined,
} from '@ant-design/icons'
import StatementImportCard from './StatementImportCard'
import type {
  IDocumentBatch,
  IImportCardState,
  IPhotoProgress,
} from './useDocumentImports'
import styles from '../style.module.scss'

const { Text } = Typography

/**
 * Waits longer than this are the free tier's DAILY token cap (~200K tokens,
 * roughly ten statement pages), not the per-minute one.
 */
const LONG_WAIT_SECONDS = 90

const photoStatus = (photo: IPhotoProgress): string => {
  switch (photo.status) {
    case 'queued':
      return 'у черзі'
    case 'reading':
      // One part is the whole page read at once; more are free-model strips.
      return photo.stripsTotal > 1
        ? `частина ${Math.min(photo.stripsDone + 1, photo.stripsTotal)} з ${photo.stripsTotal}`
        : 'читаю аркуш'
    case 'done':
      return 'прочитано'
    case 'unrecognized':
      return 'не схоже на таблицю боргу по місяцях'
    default:
      return photo.error || 'не вдалося прочитати'
  }
}

const photoIcon = (photo: IPhotoProgress) => {
  switch (photo.status) {
    case 'reading':
      return <Spin size="small" />
    case 'done':
      return <CheckOutlined className={styles.importOk} />
    case 'unrecognized':
      return <QuestionOutlined className={styles.importFlag} />
    case 'failed':
      return <CloseOutlined className={styles.importFlag} />
    default:
      return <ClockCircleOutlined />
  }
}

/** Seconds left until `until`, ticking while there is a wait. */
const useCountdown = (until?: number): number => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!until) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [until])

  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
}

/** A batch of photos in the chat: progress while reading, then one card per flat. */
const BatchCard: React.FC<{
  batch?: IDocumentBatch
  onCardChange: (key: string, patch: Partial<IImportCardState>) => void
}> = ({ batch, onCardChange }) => {
  const seconds = useCountdown(batch?.resumeAt)

  if (!batch) {
    // The page was reloaded: the photos are gone with the widget's state.
    return (
      <div className={styles.importCard}>
        <Text type="secondary">
          Фото більше не доступні — надішліть їх ще раз.
        </Text>
      </div>
    )
  }

  const unread = batch.photos.filter(
    ({ status }) => status === 'unrecognized' || status === 'failed'
  )

  if (batch.done) {
    return (
      <>
        {batch.groups.map((group) => (
          <StatementImportCard
            key={group.key}
            group={group}
            card={batch.cards[group.key]}
            onChange={(patch) => onCardChange(group.key, patch)}
          />
        ))}
        {(unread.length > 0 || batch.groups.length === 0) && (
          <div className={styles.importCard}>
            {batch.groups.length === 0 && (
              <Text>
                Не знайшов на фото таблиці боргу по місяцях. Поки що я вмію
                читати саме її (вхідне сальдо, нарахування, оплати, вихідне
                сальдо).
              </Text>
            )}
            {unread.map((photo) => (
              <Text
                key={photo.id}
                type="secondary"
                className={styles.importHint}
              >
                {photoIcon(photo)} {photo.name}: {photoStatus(photo)}
              </Text>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div className={styles.importCard}>
      <Text strong>
        Читаю {batch.photos.length > 1 ? `${batch.photos.length} фото` : 'фото'}
        …
      </Text>
      {batch.photos.map((photo) => (
        <div key={photo.id} className={styles.importProgress}>
          {photoIcon(photo)}
          <span className={styles.importProgressName}>{photo.name}</span>
          <Text type="secondary" className={styles.importHint}>
            {photoStatus(photo)}
          </Text>
        </div>
      ))}
      {seconds > 0 && (
        <Text type="secondary" className={styles.importHint}>
          <ClockCircleOutlined />{' '}
          {seconds > LONG_WAIT_SECONDS
            ? `Денний ліміт безкоштовного тарифу вичерпано — продовжу приблизно через ${Math.ceil(seconds / 60)} хв`
            : `Безкоштовний ліміт на хвилину вичерпано — продовжу через ${seconds} с`}
        </Text>
      )}
      <Text type="secondary" className={styles.importHint}>
        Зазвичай аркуш читається за кілька секунд. Якщо основна модель
        недоступна, безкоштовна читає його частинами — близько хвилини на
        частину. Чат можна закрити, поки відкрита ця сторінка.
      </Text>
    </div>
  )
}

export default BatchCard
