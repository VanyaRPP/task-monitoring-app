import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import { Tooltip } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import type { ChangelogOption } from './types'

export function useChangelogOptions(
  changelogRes: any,
  onDelete?: (logId: string) => void
): ChangelogOption[] {
  return useMemo(() => {
    const logs = changelogRes?.data ?? []

    return logs.map((log: any) => {
      const dateLabel = dayjs(log.date).format('DD.MM.YYYY HH:mm')
      const actor = log.actorEmail ?? 'system'
      const invoiceNumber = log.invoiceData?.invoiceNumber ?? '-'
      const sum = log.invoiceData?.generalSum ?? '-'
      const invoiceDate = log.invoiceData?.invoiceCreationDate
        ? dayjs(log.invoiceData.invoiceCreationDate).format('DD.MM.YYYY')
        : '-'

      return {
        value: log._id,
        shortLabel: dateLabel,
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Tooltip
              placement="right"
              title={
                <div style={{ lineHeight: 1.35 }}>
                  <div>
                    <b>Інвойс №{invoiceNumber}</b>
                  </div>
                  <div>Дата інвойсу: {invoiceDate}</div>
                  <div>Сума: {sum}</div>
                  <div>Користувач: {actor}</div>
                </div>
              }
            >
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontWeight: 600 }}>{dateLabel}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{actor}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Інвойс №{invoiceNumber}
                </div>
              </div>
            </Tooltip>
            {onDelete && (
              <CloseOutlined
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(log._id)
                }}
                title="Видалити цю версію"
              />
            )}
          </div>
        ),
      }
    })
  }, [changelogRes, onDelete])
}
