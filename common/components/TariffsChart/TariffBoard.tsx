import { EyeOutlined } from '@ant-design/icons'
import type { ISpotlightView } from '@modules/hooks/useSpotlightView'
import { Button, Empty, Flex, Typography } from 'antd'
import cn from 'classnames'
import s from './style.module.scss'
import TariffCard, { TariffCardVariant } from './TariffCard'
import type { ITariffSeries } from './tariffHistory'

interface Props {
  series: ITariffSeries[]
  view: ISpotlightView
  isDark: boolean
}

/**
 * The cards of the services: an even grid, or one of them enlarged with the
 * rest in a column beside it. Hidden ones wait above to be brought back.
 */
const TariffBoard: React.FC<Props> = ({ series, view, isDark }) => {
  const hidden = series.filter(({ key }) => view.hidden.includes(key))
  const visible = series.filter(({ key }) => !view.hidden.includes(key))
  // The enlarged service may have no tariff in the period picked now.
  const focused = visible.find(({ key }) => key === view.focused)

  const renderCard = (item: ITariffSeries, variant: TariffCardVariant) => (
    <TariffCard
      key={item.key}
      series={item}
      variant={variant}
      isDark={isDark}
      onFocus={() => view.focus(item.key)}
      onClose={() => view.focus(undefined)}
      onHide={() => view.hide(item.key)}
    />
  )

  return (
    <Flex vertical gap={16}>
      {hidden.length > 0 && (
        <Flex wrap gap={8} align="center" role="group" aria-label="Приховані">
          <Typography.Text type="secondary">Приховані:</Typography.Text>
          {hidden.map(({ key, name }) => (
            <Button
              key={key}
              size="small"
              icon={<EyeOutlined />}
              aria-label={`Показати «${name}»`}
              title="Показати"
              onClick={() => view.show(key)}
            >
              {name}
            </Button>
          ))}
        </Flex>
      )}

      {!visible.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Усі послуги приховані"
        />
      ) : !focused ? (
        <div className={s.grid}>
          {visible.map((item) => renderCard(item, 'default'))}
        </div>
      ) : (
        <div className={s.spotlight}>
          <div
            className={cn(s.spotlightLayout, {
              [s.withRail]: visible.length > 1,
            })}
          >
            {renderCard(focused, 'focused')}
            {visible.length > 1 && (
              <div className={s.rail}>
                <div className={s.railList}>
                  {visible
                    .filter((item) => item !== focused)
                    .map((item) => renderCard(item, 'compact'))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Flex>
  )
}

export default TariffBoard
