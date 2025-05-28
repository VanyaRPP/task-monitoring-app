'use client'

import { useEffect, useState, FC } from 'react'
import Lottie from 'lottie-react'

type SmartLottieProps = {
  src: string // URL to the Lottie JSON file or local path
  // Example: 'https://example.com/animation.json' or '/animations/animation.json'
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: React.CSSProperties
  fallback?: React.ReactElement | null
}

const LottieAnimation: FC<SmartLottieProps> = ({
  src,
  loop = true,
  autoplay = true,
  className,
  style,
  fallback = <div>Loading animation...</div>,
}) => {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const json = await response.json()
        setAnimationData(json)
      } catch (err) {
        setError((err as Error).message)
      }
    }

    loadAnimation()
  }, [src])

  if (error) return <div>Error loading animation: {error}</div>
  if (!animationData) return fallback

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  )
}

export default LottieAnimation
