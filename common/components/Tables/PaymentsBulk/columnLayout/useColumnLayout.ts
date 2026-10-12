import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useDragDropPanelFloatButton } from '@modules/hooks/useFloatButton'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import {
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { mergeOrder, moveColumn } from './columnLayout'

const storageKeyFor = (userId?: string) =>
  userId ? `payments-bulk-columns-${userId}` : null

/**
 * Порядок і видимість рухомих колонок + режим редагування (float button).
 * Незбережені зміни діють до перезавантаження; «Зберегти» пише в localStorage
 * під користувача — як layout дашборду.
 */
export const useColumnLayout = (movableKeys: string[]) => {
  const [order, setOrder] = useState<string[]>([])
  const [hidden, setHidden] = useState<string[]>([])
  const currentOrder = useMemo(
    () => mergeOrder(order, movableKeys),
    [order, movableKeys]
  )
  const visibleKeys = useMemo(
    () => currentOrder.filter((k) => !hidden.includes(k)),
    [currentOrder, hidden]
  )

  const [isPanelVisible, togglePanelVisible, panelFloatButton] =
    useDragDropPanelFloatButton('payments-bulk')

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(addButton(panelFloatButton))
    return () => {
      dispatch(removeButton(panelFloatButton.key))
    }
  }, [dispatch, panelFloatButton])

  const { data: user } = useGetCurrentUserQuery()
  const storageKey = storageKeyFor(user?._id?.toString())

  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (saved) {
        setOrder(saved.order ?? [])
        setHidden(saved.hidden ?? [])
      }
    } catch {}
  }, [storageKey])

  const resetLayout = useCallback(() => {
    setOrder([])
    setHidden([])
    try {
      if (storageKey) localStorage.removeItem(storageKey)
    } catch {}
    message.success('Відновлено!')
    togglePanelVisible()
  }, [storageKey, togglePanelVisible])

  const saveLayout = useCallback(() => {
    // Поки користувач не завантажився — нема під яким ключем зберігати.
    if (!storageKey) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ order: currentOrder, hidden })
      )
    } catch {}
    message.success('Збережено!')
    togglePanelVisible()
  }, [storageKey, currentOrder, hidden, togglePanelVisible])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const moveKey = useCallback(
    (activeKey: string, overKey: string) =>
      setOrder(moveColumn(currentOrder, activeKey, overKey)),
    [currentOrder]
  )
  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!isPanelVisible || !over || active.id === over.id) return
      moveKey(String(active.id), String(over.id))
    },
    [moveKey, isPanelVisible]
  )

  return {
    currentOrder,
    visibleKeys,
    hidden,
    setHidden,
    isPanelVisible,
    togglePanelVisible,
    resetLayout,
    saveLayout,
    sensors,
    moveKey,
    handleDragEnd,
  }
}
