import { UndoOutlined } from '@ant-design/icons'
import ServiceHistoryFilters from '@components/UI/ServiceHistoryFilters'
import useServiceHistory, {
  IServiceHistoryOptions,
} from '@modules/hooks/useServiceHistory'
import useSpotlightView from '@modules/hooks/useSpotlightView'
import useTheme from '@modules/hooks/useTheme'
import {
  Alert,
  Button,
  Collapse,
  ConfigProvider,
  Empty,
  Flex,
  Spin,
  Typography,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import { useMemo } from 'react'
import s from './style.module.scss'
import TariffBoard from './TariffBoard'
import { buildTariffHistory } from './tariffHistory'

const TariffHistory: React.FC<IServiceHistoryOptions> = (props) => {
  const history = useServiceHistory(props)
  const { services, period, isFetching, isError } = history
  const [appTheme] = useTheme()
  const isDark = appTheme === 'dark'
  const view = useSpotlightView(`${history.domainId}:${history.address}`)

  const { series, unpriced } = useMemo(
    () => buildTariffHistory(services, period),
    [services, period]
  )

  return (
    <ConfigProvider locale={ukUA}>
      <Flex vertical gap={16}>
        <ServiceHistoryFilters domains={props.domains} history={history}>
          <Button
            className={s.reset}
            icon={<UndoOutlined />}
            title="Повернути звичайний вигляд і приховані послуги"
            disabled={!view.isChanged}
            onClick={view.reset}
          >
            Скинути
          </Button>
        </ServiceHistoryFilters>

        {isError ? (
          <Alert message="Помилка завантаження даних" type="error" showIcon />
        ) : (
          <Spin spinning={isFetching}>
            {!series.length ? (
              <Empty
                description={
                  isFetching
                    ? 'Завантаження...'
                    : 'Немає тарифів за обраний період'
                }
              />
            ) : (
              <TariffBoard series={series} view={view} isDark={isDark} />
            )}
            {unpriced.length > 0 && (
              <Typography.Paragraph type="secondary" className={s.unpriced}>
                Без тарифу за цей період: {unpriced.join(', ')}
              </Typography.Paragraph>
            )}
          </Spin>
        )}
      </Flex>
    </ConfigProvider>
  )
}

/**
 * How the tariff of every service of one domain address changed. Collapsed by
 * default, so nothing is loaded until it is opened.
 */
const TariffsChart: React.FC<IServiceHistoryOptions> = (props) => (
  <Collapse
    size="small"
    style={{ marginTop: 16 }}
    items={[
      {
        key: 'tariffs',
        label: 'Тарифи послуг',
        children: <TariffHistory {...props} />,
      },
    ]}
  />
)

export default TariffsChart
