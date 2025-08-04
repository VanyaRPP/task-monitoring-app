import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useState, useEffect, useCallback } from 'react'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import { Roles } from '@utils/constants'
import { Col, Row, Space, Button, Flex, Tooltip } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
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

  const [layout, setLayout] = useState<Layout[]>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    return saved
      ? (JSON.parse(saved) as Layout[])
      : ALL_WIDGETS.map((w, i) => ({
          i: w,
          x: 0,
          w: 1,
          h: 2,
          y: 0,
        }))
  })
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout)
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout))
  }, [])

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
    <div style={{ width: '100%' }}>
      {isPanelVisible && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
            width: '100%',
            top: '90px',
            backgroundColor: isDark ? '#141414' : '#fff',
            color: isDark ? '#fff' : '#000',
            padding: '15px',
            paddingRight: '25px',
            position: 'sticky',
            zIndex: 1000,
            border: `1px solid ${isDark ? '#333' : '#d9d9d9'}`,
            borderRadius: '8px',
            boxShadow: isDark ? undefined : '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: 25,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 1,
                height: 23,
                backgroundColor: '#555',
                marginRight: 25,
                marginTop: 5,
              }}
            />
            <Tooltip title="Disable drag & drop">
              <Button icon={<CloseOutlined />} onClick={togglePanelVisible} />
            </Tooltip>
          </div>
        </div>
      )}
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
              {widgetMap[item.i as WidgetKey]}
            </WidgetWrapper>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  )
}

export default Dashboard
