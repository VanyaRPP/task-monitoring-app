import {
  CompressOutlined,
  ExpandOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons'
import { formatAxisValue, formatValue } from '@utils/formatChartValue'
import { Button, Card, Flex, theme, Typography } from 'antd'
import cn from 'classnames'
import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { getChangeText } from './changeText'
import {
  getLatestPoint,
  getTariffChange,
  ITariffPoint,
  ITariffSeries,
} from './tariffHistory'
import s from './style.module.scss'

const Line = dynamic(
  () => import('@ant-design/plots').then(({ Line }) => Line),
  { ssr: false }
)

// Checked for contrast against each theme's surface.
const COLORS = { light: '#257de0', dark: '#338ced' }

/** In the grid, enlarged, or pushed aside while another card is enlarged. */
export type TariffCardVariant = 'default' | 'focused' | 'compact'

const CHART_HEIGHT: Record<TariffCardVariant, number> = {
  default: 160,
  focused: 400,
  compact: 48,
}

interface Props {
  series: ITariffSeries
  variant: TariffCardVariant
  isDark: boolean
  onFocus: () => void
  onClose: () => void
  onHide: () => void
}

/** One service: what it costs now, how that changed and every month of it. */
const TariffCard: React.FC<Props> = ({
  series,
  variant,
  isDark,
  onFocus,
  onClose,
  onHide,
}) => {
  const { token } = theme.useToken()
  const { name, unit, points } = series
  const isFocused = variant === 'focused'
  const isCompact = variant === 'compact'
  const color = COLORS[isDark ? 'dark' : 'light']
  const latest = getLatestPoint(points)
  const withUnit = (value: number | null) =>
    unit && value !== null
      ? `${formatValue(value)} ${unit}`
      : formatValue(value)
  const axis = {
    title: false,
    labelFill: token.colorTextSecondary,
    labelOpacity: 1,
  }

  // The grid collapses around an enlarged card, which may leave it off screen.
  const cardRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (isFocused) cardRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [isFocused])

  // The second click of a double click may land on a card that has only just
  // been enlarged: it must not shrink it straight back.
  const wasFocused = useRef(false)
  const handleClick = (event: React.MouseEvent) => {
    if (event.detail > 1) return
    wasFocused.current = isFocused
    if (!isFocused) onFocus()
  }
  const handleDoubleClick = () => {
    if (isFocused && wasFocused.current) onClose()
  }
  // A double click is a command here: it should not select the text.
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.detail > 1) event.preventDefault()
  }
  // A button of the card does its own thing, not the card's.
  const only = (action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  return (
    <section
      ref={cardRef}
      className={cn(s.card, s[variant])}
      aria-label={name}
      aria-current={isFocused || undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      <Card size="small">
        <Flex gap={4} align="start" justify="space-between">
          <Typography.Text strong className={s.name}>
            {name}
          </Typography.Text>
          <Flex onDoubleClick={(event) => event.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={isFocused ? <CompressOutlined /> : <ExpandOutlined />}
              aria-label={`${isFocused ? 'Зменшити' : 'Збільшити'} «${name}»`}
              title={isFocused ? 'Зменшити (або подвійний клік)' : 'Збільшити'}
              onClick={only(isFocused ? onClose : onFocus)}
            />
            <Button
              type="text"
              size="small"
              icon={<EyeInvisibleOutlined />}
              aria-label={`Приховати «${name}»`}
              title="Приховати"
              onClick={only(onHide)}
            />
          </Flex>
        </Flex>
        <div className={s.latest}>
          <span className={s.value}>{withUnit(latest.value)}</span>
          {!isCompact && (
            <Typography.Text type="secondary">
              за {latest.month}
            </Typography.Text>
          )}
        </div>
        <Typography.Text type="secondary" className={s.change}>
          {getChangeText(getTariffChange(points), unit)}
        </Typography.Text>
        <Line
          data={points}
          xField="month"
          yField="value"
          height={CHART_HEIGHT[variant]}
          theme={isDark ? 'dark' : 'light'}
          scale={{ y: { nice: true } }}
          style={{ stroke: color, lineWidth: 2 }}
          // Without points a month between two gaps would not be visible.
          point={{
            sizeField: isCompact ? 2 : isFocused ? 5 : 4,
            style: { fill: color, stroke: color },
          }}
          // A card pushed aside only hints at the shape of the line.
          axis={
            isCompact
              ? false
              : {
                  x: {
                    ...axis,
                    tickStroke: token.colorSplit,
                    // A narrow card thins the months out instead of turning
                    // them. The padding makes that happen before they touch.
                    labelAutoRotate: false,
                    labelAutoHide: true,
                    labelFormatter: (month: string) => `\u2002${month}\u2002`,
                  },
                  y: {
                    ...axis,
                    gridStroke: token.colorSplit,
                    labelFormatter: formatAxisValue,
                  },
                }
          }
          tooltip={
            isCompact
              ? false
              : {
                  title: 'month',
                  items: [
                    (point: ITariffPoint) => ({
                      name: 'Тариф',
                      value: withUnit(point.value),
                      color,
                    }),
                  ],
                }
          }
        />
      </Card>
    </section>
  )
}

export default TariffCard
