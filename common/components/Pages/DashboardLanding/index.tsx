'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import s from './DashboardLanding.module.scss'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type LottieData = Record<string, any>

const DashboardLanding = () => {
  const [animationData, setAnimationData] = useState<LottieData | null>(null)

  useEffect(() => {
    let alive = true

    fetch('/animations/AnimationCity.json')
      .then((r) => r.json())
      .then((data) => {
        if (alive) setAnimationData(data)
      })
      .catch(console.error)

    return () => {
      alive = false
    }
  }, [])

  return (
    <section className={s.section}>
      <div className={s.bgLines} />
      <div className={s.blob} />

      <div className={s.panel}>
        <div className={s.grid}>
          <div className={s.heroCard}>
            <h1 className={s.title}>Ласкаво просимо до E-ORENDA!</h1>
            <p className={s.text}>
              Керуйте процесом надання послуг нерухомості та систематизуйте відносини між
              користувачами за допомогою нашого сайту! Ресурс допоможе з автоматичним
              розрахунком платежів та своєчасним формуванням та виставленням рахунків...
            </p>
          </div>

          <div className={s.visual}>
            <div className={s.lottieWrap}>
              {animationData && (
                <Lottie
                  animationData={animationData}
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardLanding
