import { useThemeFloatButton } from '@modules/hooks/useFloatButton'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { setMenuOffset } from '@modules/store/floatButtonSlice'
import { SettingFilled } from '@ant-design/icons'
import { FloatButtonItem } from '@utils/types'
import { FloatButton } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

type FloatButtonPlacementProps = {
  buttons?: FloatButtonItem[]
}

export const FloatButtonsLayoutAddon: React.FC<FloatButtonPlacementProps> = ({
  buttons = [],
}) => {
  const dispatch = useAppDispatch()
  const themeBtn = useThemeFloatButton()
  const storedButtons = useAppSelector((state) => state.floatButtons.buttons)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerTargetRef = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)

  const allButtons = [...buttons, ...storedButtons, themeBtn]
  const buttonsCount = allButtons.length
  const isGroup = buttonsCount > 1

  useEffect(() => {
    const remember = (e: PointerEvent) => {
      pointerTargetRef.current = e.target as HTMLElement | null
    }

    document.addEventListener('pointerdown', remember, true)
    return () => document.removeEventListener('pointerdown', remember, true)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && pointerTargetRef.current?.closest('[data-ai-chat]')) return
    setOpen(nextOpen)
  }

  useEffect(() => {
    const root = containerRef.current

    const getWrap = () =>
      root?.querySelector<HTMLElement>('.ant-float-btn-group-wrap') ?? null

    const publish = () => {
      if (!open || !isGroup) {
        dispatch(setMenuOffset(0))
        return
      }

      const menuHeight = getWrap()?.offsetHeight || buttonsCount * 41

      dispatch(setMenuOffset(16 + menuHeight))
    }

    publish()

    if (!open || !isGroup) return

    let observer: ResizeObserver | null = null
    const frame = requestAnimationFrame(() => {
      publish()

      const wrap = getWrap()
      if (wrap && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(publish)
        observer.observe(wrap)
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [open, isGroup, buttonsCount, dispatch])

  useEffect(() => () => void dispatch(setMenuOffset(0)), [dispatch])

  return (
    <div ref={containerRef}>
      {isGroup ? (
        <FloatButton.Group
          type="primary"
          shape="square"
          trigger="click"
          open={open}
          onOpenChange={handleOpenChange}
          icon={<SettingFilled />}
        >
          {allButtons.map((btn) => (
            <FloatButton
              key={btn.key}
              icon={btn.icon}
              onClick={btn.onClick}
              tooltip={{
                title: btn.tooltip,
                placement: 'left',
              }}
            />
          ))}
        </FloatButton.Group>
      ) : (
        <FloatButton
          key={themeBtn.key}
          icon={themeBtn.icon}
          onClick={themeBtn.onClick}
          tooltip={{
            title: themeBtn.tooltip,
            placement: 'left',
          }}
          type="primary"
        />
      )}
    </div>
  )
}
