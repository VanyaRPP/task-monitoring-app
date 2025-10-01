import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import { Roles } from '@utils/constants'
import { Col, Row, Space, Button, Flex,  message, Tooltip } from 'antd'
import { CloseOutlined, SaveOutlined } from '@ant-design/icons'
import PaymentsChart from '@components/DashboardPage/blocks/paymentChart'
import ProfitPage from '@components/Pages/ProfiitPage'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { useEditModelFloatButton, useDragDropPanelFloatButton  } from '@modules/hooks/useFloatButton'
import { useDispatch } from 'react-redux'
import { WidthProvider } from 'react-grid-layout'
import GridLayout, { Layout } from 'react-grid-layout'
import s from './style.module.scss'
import useTheme from '@modules/hooks/useTheme'

import { WidgetWrapper } from '@components/UI/WidgetWrapper'
const MARGIN_Y = 12
const MARGIN_X = 12
const ReactGridLayout = WidthProvider(GridLayout)
const LAYOUT_STORAGE_KEY = 'dashboard-layout'
const ALL_WIDGETS = [
  'payments',
  'paymentsChart',
  'services',
  'streets',
  'domain',
  'realEstate',
  'profits',
  'companies',
] as const
type WidgetKey = (typeof ALL_WIDGETS)[number]
const widgetLabels: Record<WidgetKey, string> = {
  payments: 'Платежі',
  paymentsChart: 'Графік платежів',
  services: 'Послуги',
  streets: 'Адреси',
  domain: 'Надавачі послуг',
  realEstate: 'Компанії',
  profits: 'Прибутки',
  companies: 'Займані площі',
}

const widgetMap: Record<WidgetKey, React.ReactNode> = {
  payments: <PaymentsBlock />,
  paymentsChart: <PaymentsChart />,
  services: <ServicesBlock />,
  streets: <StreetsBlock />,
  domain: <DomainsBlock />,
  realEstate: <RealEstateBlock />,
  profits: <ProfitPage />,
  companies: <CompaniesAreaChart />,
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch()
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  const [isEditMode, toggleEditMode, editFloatButton] =
    useEditModelFloatButton('dashboard')
  const [isPanelVisible, togglePanelVisible, panelFloatButton] =
    useDragDropPanelFloatButton('dashboard')

  const [theme] = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    dispatch(addButton(panelFloatButton))
    return () => {
      dispatch(removeButton(panelFloatButton.key))
    }
  }, [dispatch, panelFloatButton])

  useEffect(() => {
    if (isPanelVisible && !isEditMode) {
      toggleEditMode()
    } else if (!isPanelVisible && isEditMode) {
      toggleEditMode()
    }
  }, [isPanelVisible])
  const getLayoutStorageKey = (userId?: string) =>
    userId ? `dashboard-layout-${userId}` : 'dashboard-layout'
    const visibleWidgets = useMemo(() => {
      if (isGlobalAdmin === undefined) {
    return ALL_WIDGETS
  }
  return isGlobalAdmin
    ? ALL_WIDGETS
    : ALL_WIDGETS.filter((w) => w !== 'profits')
}, [isGlobalAdmin])
const visibleWidgetMap = useMemo(() => {
  return Object.fromEntries(
    visibleWidgets.map((key) => [key, widgetMap[key]])
  ) as typeof widgetMap
}, [visibleWidgets])
  const DEFAULT_LAYOUT: Layout[] = visibleWidgets.map((w) => ({
    i: w,
    x: 0,
    w: 1,
    h: 2,
    y: 0,
  }))

  const [layout, setLayout] = useState<Layout[]>(DEFAULT_LAYOUT)
  const [tempLayout, setTempLayout] = useState<Layout[]>(DEFAULT_LAYOUT)

 const [isLayoutReady, setIsLayoutReady] = useState(false)

  useEffect(() => {
    const userId = userResponse?._id?.toString()
    if (!userId) return

    const saved = localStorage.getItem(getLayoutStorageKey(userId))
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Layout[]
        setLayout(parsed)
        setTempLayout(parsed)
      } catch {}
    }
    setIsLayoutReady(true)
  }, [userResponse?._id])

  
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      setTempLayout(newLayout)
    },
    []
  )
  useLayoutEffect(() => {
    setTempLayout(layout)
  }, [layout])

  const handleNodeHeight = useCallback((id: string, newH: number) => {
    setLayout((prev) => {
      const idx = prev.findIndex((item) => item.i === id)
      if (idx === -1 || prev[idx].h === newH) {
        return prev
      }
      const next = [...prev]
      next[idx] = { ...prev[idx], h: newH }
      return next
    })
  }, [])
  return (
    <div className={s.wrapper}>
      {isPanelVisible && (
        <div className={`${s.toolbar} ${isDark ? s.dark : s.light}`}>
          <div className={s.buttonsBlock}>
            {layout.map((item) => (
              <Button
                key={item.i}
                type="link"
                onClick={() => {
                  const element = document.getElementById(item.i)
                  if (element) {
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                  }
                }}
              >
                {widgetLabels[item.i as WidgetKey]}
              </Button>
            ))}
          </div>
          <div className={s.actions}>
            <div className={s.divider}/>
           <Tooltip title="Зберегти">
              <Button
                icon={<SaveOutlined />}
                onClick={() => {
                  const userId = userResponse?._id?.toString()
                  if (!userId) return
                  localStorage.setItem(getLayoutStorageKey(userId), JSON.stringify(tempLayout))
                  setLayout(tempLayout)
                  message.success('Збережено!')
                  togglePanelVisible()
                }}
              />
            </Tooltip>
            <Tooltip title="Вийти з режиму редагування">
              <Button icon={<CloseOutlined />} onClick={togglePanelVisible} />
            </Tooltip>
          </div>
        </div>
      )}
      {isLayoutReady && (
      <ReactGridLayout
        className="dashboard-grid"
        compactType="vertical"
        layout={layout}
        cols={1}
        rowHeight={60}
        margin={[MARGIN_X, MARGIN_Y]}
        useCSSTransforms={true}
        listenToWindowResize={true}
        isDraggable={isEditMode}
        isResizable={false}
        isBounded={true}
        onLayoutChange={handleLayoutChange}
      >
        {layout.map((item) => (
          <div key={item.i} data-grid={item} className={s.gridItem} id={item.i}>
            <WidgetWrapper
              id={item.i}
              rowHeight={60}
              marginY={MARGIN_Y}
              isEditMode={isEditMode}
              onHeightChange={handleNodeHeight}
            >
              {visibleWidgetMap[item.i as WidgetKey]}
            </WidgetWrapper>
          </div>
        ))}
      </ReactGridLayout>
      )}
    </div>
  )
}

export default Dashboard
