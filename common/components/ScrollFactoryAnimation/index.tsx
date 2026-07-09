import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react'
import s from './style.module.scss'

const FRAME_COUNT = 193
const FRAME_PATH = '/animations/factory-frames/frame_'
const FRAME_EXT = '.jpg'

type Annotation = {
  start: number
  peak: number
  end: number
  number: string
  title: string
  body: string
  hero?: boolean
}

const ANNOTATIONS: Annotation[] = [
  {
    start: 0.07,
    peak: 0.17,
    end: 0.27,
    number: '01',
    title: 'Імпорт з банку',
    body: 'Bank API сам підтягує транзакції та баланс — без ручної звірки оплат.',
  },
  {
    start: 0.27,
    peak: 0.35,
    end: 0.43,
    number: '02',
    title: 'Авто-розрахунок',
    body: 'Формули, валюти, м² — система рахує сама за конфігурацією послуг.',
  },
  {
    start: 0.43,
    peak: 0.51,
    end: 0.59,
    number: '03',
    title: 'Bulk-генерація',
    body: 'Один клік — десятки персоналізованих інвойсів за секунди.',
    hero: true,
  },
  {
    start: 0.59,
    peak: 0.66,
    end: 0.74,
    number: '04',
    title: 'Розумна маршрутизація',
    body: 'Кожен інвойс знаходить свого клієнта — за каналом, мовою, валютою.',
  },
  {
    start: 0.74,
    peak: 0.82,
    end: 0.9,
    number: '05',
    title: 'Multi-channel доставка',
    body: 'Telegram, Email і PDF — одночасно, як зручніше клієнту.',
  },
  {
    start: 0.9,
    peak: 0.95,
    end: 1.0,
    number: '06',
    title: 'Real-time аналітика',
    body: 'Дашборд з прибутком, балансом і боржниками — наживо.',
  },
]

const smoothstep = (t: number) => t * t * (3 - 2 * t)
const computeCardOpacity = (progress: number, card: Annotation): number => {
  if (progress <= card.start || progress >= card.end) return 0
  if (progress < card.peak) {
    const t = (progress - card.start) / (card.peak - card.start)
    return smoothstep(t)
  }
  const t = (progress - card.peak) / (card.end - card.peak)
  return 1 - smoothstep(t)
}

type Props = {
  scrollHeight?: number
  introTitle?: string
  introSubtitle?: string
  action?: ReactNode
}

const ScrollFactoryAnimation: FC<Props> = ({
  scrollHeight = 350,
  introTitle,
  introSubtitle,
  action,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<HTMLImageElement[]>([])
  const lastFrameRef = useRef<number>(-1)
  const rafIdRef = useRef<number | null>(null)
  const targetProgressRef = useRef<number>(0)
  const displayedProgressRef = useRef<number>(0)
  const scrollingRef = useRef<boolean>(false)
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    let loadedCount = 0
    const frames: HTMLImageElement[] = []
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image()
      img.src = `${FRAME_PATH}${String(i).padStart(4, '0')}${FRAME_EXT}`
      img.onload = img.onerror = () => {
        if (cancelled) return
        loadedCount += 1
        setLoadProgress(loadedCount / FRAME_COUNT)
        if (loadedCount === FRAME_COUNT) setLoaded(true)
      }
      frames.push(img)
    }
    framesRef.current = frames
    return () => {
      cancelled = true
    }
  }, [])

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect =
      canvas.parentElement?.getBoundingClientRect() ||
      canvas.getBoundingClientRect()
    const w = rect.width || window.innerWidth / 2
    const h = rect.height || window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    lastFrameRef.current = -1
  }, [])

  useEffect(() => {
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)
    return () => window.removeEventListener('resize', sizeCanvas)
  }, [sizeCanvas])

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    const img = framesRef.current[index]
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return
    if (lastFrameRef.current === index) return
    lastFrameRef.current = index
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const scale = Math.min(cw / iw, ch / ih) * 1.02
    const dw = iw * scale
    const dh = ih * scale
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  useEffect(() => {
    const LERP_RATE = 0.12
    const SETTLE_THRESHOLD = 0.0008
    const computeTarget = () => {
      const container = containerRef.current
      if (!container) return 0
      const rect = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      if (total <= 0) return 0
      return Math.max(0, Math.min(1, -rect.top / total))
    }

    const tick = () => {
      const target = computeTarget()
      targetProgressRef.current = target
      const displayed = displayedProgressRef.current
      const diff = target - displayed
      const newDisplayed =
        Math.abs(diff) < SETTLE_THRESHOLD
          ? target
          : displayed + diff * LERP_RATE
      displayedProgressRef.current = newDisplayed

      setScrollProgress(newDisplayed)
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.floor(newDisplayed * FRAME_COUNT))
      )

      drawFrame(frameIndex)
      const settled = Math.abs(diff) < SETTLE_THRESHOLD
      if (!settled || scrollingRef.current) {
        rafIdRef.current = requestAnimationFrame(tick)
      } else {
        rafIdRef.current = null
      }
    }

    const kick = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(tick)
      }
    }

    const onScroll = () => {
      scrollingRef.current = true
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current)
      scrollEndTimerRef.current = setTimeout(() => {
        scrollingRef.current = false
      }, 180)
      kick()
    }

    kick()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, { capture: true } as any)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current)
        scrollEndTimerRef.current = null
      }
    }
  }, [drawFrame])

  useEffect(() => {
    if (loadProgress > 0 && lastFrameRef.current === -1) {
      drawFrame(0)
    }
  }, [loadProgress, drawFrame])

  useEffect(() => {
    if (loaded) {
      lastFrameRef.current = -1
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      const progress =
        total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.floor(progress * FRAME_COUNT))
      )
      drawFrame(frameIndex)
    }
  }, [loaded, drawFrame])

  const cardOpacities = useMemo(
    () => ANNOTATIONS.map((a) => computeCardOpacity(scrollProgress, a)),
    [scrollProgress]
  )

  const showScrollHint = scrollProgress < 0.04 && loaded

  return (
    <div
      className={s.container}
      ref={containerRef}
      style={{ height: `${scrollHeight}vh` }}
    >
      <div
        className={s.progressBar}
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <div className={s.stickyWrapper}>
        <div className={s.leftContent}>
          <h1 className={s.heroTitle}>
            Ласкаво просимо до <br />{' '}
            {/* Додали переніс рядка для кращої композиції */}
            <span className={s.textAccent}>E-ORENDA!</span>
          </h1>
          <p className={s.heroSubtitle}>
            Платформа, що перетворює виставлення рахунків на автоматичний
            конвеєр — від імпорту банківських даних до доставки готових інвойсів
            вашим клієнтам.
          </p>
          {action}
        </div>

        <div className={s.rightContent}>
          {/* Intentional "screen" bezel — frames the factory render so its
              rectangular, baked-light edge reads as a deliberate display
              rather than a harsh cut against the theme background. */}
          <div className={s.screen}>
            <canvas ref={canvasRef} className={s.canvas} />
            {/* Wash that recolors the baked white toward the theme bg */}
            <div className={s.factoryWash} aria-hidden />
          </div>
          {/* ВІДНОВЛЕНІ КАРТКИ З НАПИСАМИ */}
          {ANNOTATIONS.map((card, idx) => {
            const opacity = cardOpacities[idx]
            const yOffset = (1 - opacity) * 8
            return (
              <div
                key={idx}
                className={`${s.card} ${card.hero ? s.heroCard : ''}`}
                style={{
                  opacity,
                  transform: `translateX(-50%) translateY(${yOffset}px)`,
                  pointerEvents: opacity > 0.5 ? 'auto' : 'none',
                }}
                aria-hidden={opacity < 0.5}
              >
                <div className={s.cardNumber}>{card.number}</div>
                <h3 className={s.cardTitle}>{card.title}</h3>
                <p className={s.cardBody}>{card.body}</p>
              </div>
            )
          })}

          <div
            className={s.scrollHint}
            style={{ opacity: showScrollHint ? 1 : 0 }}
          >
            <span>Скрольте, щоб пробудити фабрику</span>
            <div className={s.scrollArrow}>↓</div>
          </div>

          {!loaded && (
            <div className={s.loader} aria-label="Завантаження анімації">
              <div className={s.loaderBar}>
                <div
                  className={s.loaderFill}
                  style={{ width: `${loadProgress * 100}%` }}
                />
              </div>

              <span className={s.loaderText}>
                {Math.round(loadProgress * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ScrollFactoryAnimation
