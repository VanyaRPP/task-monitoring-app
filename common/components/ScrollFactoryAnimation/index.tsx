import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import s from './style.module.scss'

const FRAME_COUNT = 193
const FRAME_PATH = '/animations/factory-frames/frame_'
const FRAME_EXT = '.jpg'

type Annotation = {
  /** Progress at which the card begins to fade in */
  start: number
  /** Progress at peak visibility (fully shown) */
  peak: number
  /** Progress at which the card finishes fading out */
  end: number
  number: string
  title: string
  body: string
  hero?: boolean
}

// Ranges aligned to the actual video beats (8s total → progress fractions):
// 0.0–0.06   power-on (no card)
// 0.06–0.27  inputs / Bank API
// 0.27–0.43  processing / auto-calc
// 0.43–0.59  ★ bulk multiplication (hero)
// 0.59–0.74  sorting / routing
// 0.74–0.90  multi-channel delivery
// 0.90–1.0   live analytics
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

// Smoothstep easing — produces a much nicer fade than linear
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
  /** Scroll length in vh — controls how long the animation takes. Default 350 (3.5 viewports). */
  scrollHeight?: number
  /** Optional intro text shown over the dormant first frame */
  introTitle?: string
  introSubtitle?: string
}

const ScrollFactoryAnimation: FC<Props> = ({
  scrollHeight = 350,
  introTitle,
  introSubtitle,
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

  // Preload all frames
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

  // Canvas sizing with Retina support — derive size from actual layout box
  // (NOT from window.innerHeight, which can differ from 100vh due to browser UI)
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = rect.width || window.innerWidth
    const h = rect.height || window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    // Do NOT override style width/height — CSS (`width:100%; height:100%` of
    // the 100vh sticky parent) decides the actual rendered size.
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

    const isMobile = window.innerWidth < 768
    // Cover-fit on desktop, slightly zoomed contain on mobile to keep object centered
    const scale = isMobile
      ? Math.min(cw / iw, ch / ih) * 1.15
      : Math.max(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  // Scroll-driven frame mapping with lerp (smooth follow) for buttery animation
  useEffect(() => {
    // LERP_RATE: how fast displayed progress catches up to target each frame.
    // Higher = snappier (1.0 = instant); lower = smoother but laggier.
    // 0.12 ≈ ~135ms to settle — buttery follow without too much input lag.
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
        Math.abs(diff) < SETTLE_THRESHOLD ? target : displayed + diff * LERP_RATE
      displayedProgressRef.current = newDisplayed

      setScrollProgress(newDisplayed)
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.floor(newDisplayed * FRAME_COUNT))
      )
      drawFrame(frameIndex)

      // Continue ticking while either still scrolling OR not yet settled
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
      // After ~180ms of no scroll events, mark scrolling done
      scrollEndTimerRef.current = setTimeout(() => {
        scrollingRef.current = false
      }, 180)
      kick()
    }

    // Initial draw at current position
    kick()

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, {
        capture: true,
      } as any)
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

  // Re-draw first frame as soon as it loads (so users see something immediately)
  useEffect(() => {
    if (loadProgress > 0 && lastFrameRef.current === -1) {
      drawFrame(0)
    }
  }, [loadProgress, drawFrame])

  // Once everything's loaded, kick a redraw at the current scroll position
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

  const showIntro = scrollProgress < 0.04
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
      <div className={s.sticky}>
        <canvas ref={canvasRef} className={s.canvas} />

        {(introTitle || introSubtitle) && (
          <div
            className={s.intro}
            style={{
              opacity: showIntro ? 1 : 0,
              pointerEvents: showIntro ? 'auto' : 'none',
            }}
          >
            {introTitle && <h1 className={s.introTitle}>{introTitle}</h1>}
            {introSubtitle && (
              <p className={s.introSubtitle}>{introSubtitle}</p>
            )}
          </div>
        )}

        {ANNOTATIONS.map((card, idx) => {
          const opacity = cardOpacities[idx]
          // Slight rise from below as the card comes in (8px → 0px)
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
  )
}

export default ScrollFactoryAnimation
