import { useCallback, RefObject, useEffect, useState } from 'react'
import { Button, Tour, TourProps } from 'antd'

const STORAGE_KEY = 'landingScreenshotsTourSeen'

const hasSeenTour = (): boolean => {
  try {
    return !!localStorage.getItem(STORAGE_KEY)
  } catch {
    return true
  }
}

const markTourSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // storage unavailable (private mode) — the tour just won't be remembered
  }
}

interface GuideTourProps {
  ready: boolean
  startSignal: number
  title: string
  summary: string
  imageRef: RefObject<HTMLElement>
  details: string[]
  onOpenChange: (open: boolean) => void
}

const GuideTour: React.FC<GuideTourProps> = ({
  ready,
  startSignal,
  title,
  summary,
  imageRef,
  details,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const changeOpen = useCallback(
    (value: boolean) => {
      setOpen(value)
      onOpenChange(value)
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (!ready || hasSeenTour()) return

    markTourSeen()
    setDetailsOpen(false)
    changeOpen(true)
  }, [ready, changeOpen])

  useEffect(() => {
    if (startSignal > 0) {
      setDetailsOpen(false)
      changeOpen(true)
    }
  }, [startSignal, changeOpen])

  const steps: NonNullable<TourProps['steps']> = [
    {
      title: detailsOpen ? 'Детальніше' : title,
      description: detailsOpen ? (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {details.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        summary
      ),
      target: () => imageRef.current,
      style: { width: 'min(720px, 92vw)' },
    },
  ]

  const renderActions = () =>
    detailsOpen ? (
      <Button type="primary" onClick={() => changeOpen(false)}>
        Закрити
      </Button>
    ) : (
      <Button type="primary" onClick={() => setDetailsOpen(true)}>
        Детальніше
      </Button>
    )

  return (
    <Tour
      open={open}
      onClose={() => changeOpen(false)}
      steps={steps}
      actionsRender={renderActions}
      current={0}
      mask={{ color: 'rgba(0, 0, 0, 0.5)' }}
      type="primary"
    />
  )
}

export default GuideTour
