import { useState } from 'react'
import CardSwap, { Card } from '@components/CardSwapper/Card'
import ScreenshotLightbox from '@components/ScreenshotLightbox'
import { LANDING_SCREENSHOTS } from './screenshots'

const CardPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div>
      <CardSwap
        cardDistance={20}
        verticalDistance={30}
        delay={3000}
        pauseOnHover
        onCardClick={setActiveIndex}
      >
        {LANDING_SCREENSHOTS.map((screenshot) => (
          <Card key={screenshot.src}>
            <img
              src={screenshot.src}
              alt={screenshot.alt}
              style={{ width: '100%', height: '100%' }}
            />
          </Card>
        ))}
      </CardSwap>

      <ScreenshotLightbox
        images={LANDING_SCREENSHOTS}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </div>
  )
}

export default CardPage
