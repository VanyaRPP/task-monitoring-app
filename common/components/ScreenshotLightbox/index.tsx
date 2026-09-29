import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from 'antd'
import {
  CloseOutlined,
  LeftOutlined,
  QuestionCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { LandingScreenshot } from '@components/CardSwapper/screenshots'
import GuideTour from './GuideTour'
import s from './style.module.scss'

interface ScreenshotLightboxProps {
  images: LandingScreenshot[]
  activeIndex: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

interface LightboxModalProps {
  images: LandingScreenshot[]
  activeIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  activeIndex,
  onClose,
  onNavigate,
}) => {
  const [ready, setReady] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [startSignal, setStartSignal] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)

  const current = images[activeIndex]

  const navigate = (direction: 1 | -1) => {
    onNavigate((activeIndex + direction + images.length) % images.length)
  }

  useEffect(() => {
    if (tourOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate(-1)
      if (e.key === 'ArrowRight') navigate(1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, tourOpen])

  return (
    <>
      <Modal
        open
        onCancel={onClose}
        afterOpenChange={setReady}
        keyboard={!tourOpen}
        footer={null}
        closable={false}
        centered
        width="min(94vw, 1300px)"
        className={s.Lightbox}
      >
        <div className={s.Content}>
          <div className={s.ImageWrap}>
            <button
              type="button"
              className={s.CloseButton}
              onClick={onClose}
              aria-label="Закрити"
            >
              <CloseOutlined />
            </button>

            <button
              type="button"
              className={s.HelpButton}
              onClick={() => setStartSignal((value) => value + 1)}
              aria-label="Показати гайд ще раз"
              title="Показати гайд ще раз"
            >
              <QuestionCircleOutlined />
            </button>

            {images.length > 1 && (
              <button
                type="button"
                className={`${s.Arrow} ${s.ArrowLeft}`}
                onClick={() => navigate(-1)}
                aria-label="Попередній скріншот"
              >
                <LeftOutlined />
              </button>
            )}

            <img
              ref={imageRef}
              src={current.src}
              alt={current.alt}
              className={s.Image}
            />

            {images.length > 1 && (
              <button
                type="button"
                className={`${s.Arrow} ${s.ArrowRight}`}
                onClick={() => navigate(1)}
                aria-label="Наступний скріншот"
              >
                <RightOutlined />
              </button>
            )}
          </div>
        </div>
      </Modal>

      <GuideTour
        ready={ready}
        startSignal={startSignal}
        title={current.title}
        summary={current.summary}
        imageRef={imageRef}
        details={current.details}
        onOpenChange={setTourOpen}
      />
    </>
  )
}

const ScreenshotLightbox: React.FC<ScreenshotLightboxProps> = (props) => {
  if (props.activeIndex === null) return null

  return <LightboxModal {...props} activeIndex={props.activeIndex} />
}

export default ScreenshotLightbox
