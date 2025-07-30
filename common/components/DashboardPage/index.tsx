import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useState, useEffect, useCallback } from 'react'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import { Roles } from '@utils/constants'
import { Col, Row, Space, Button, Flex } from 'antd'
import PaymentsChart from '@components/DashboardPage/blocks/paymentChart'
import ProfitPage from '@components/Pages/ProfiitPage'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import { useEditModelFloatButton } from '@modules/hooks/useFloatButton'
import { useDispatch } from 'react-redux'
import { WidthProvider } from 'react-grid-layout'
import GridLayout, { Layout } from 'react-grid-layout'
import s from './style.module.scss'

import { WidgetWrapper } from '@components/UI/WidgetWrapper'
const MARGIN_Y = 12
const MARGIN_X = 12
const ReactGridLayout = WidthProvider(GridLayout)
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
  useEffect(() => {
    dispatch(addButton(editFloatButton))
    return () => {
      dispatch(removeButton(editFloatButton.key))
    }
  }, [dispatch, editFloatButton])

  const [layout, setLayout] = useState<Layout[]>(() =>
    ALL_WIDGETS.filter((w) => w !== 'streets' || isGlobalAdmin).map((w, i) => ({
      i: w,
      x: 0,
      w: 1,
      h: 2,
      y: 0,
    }))
  )
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
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Flex justify='flex-end' gap='small' style={{ 
        width: '100%',
        backgroundColor: '#141414',
        padding: '5px',
        position: 'sticky',
        zIndex: 1000,
        border: '1px solid #333',
        borderRadius: '8px',
        }}>
        <Button>
          test
        </Button>
        <Button>
          test
        </Button>
      </Flex>
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
        onLayoutChange={() => {
          /* TODO: saveChanges */
        }}
      >
        {layout.map((item) => (
          <div key={item.i} data-grid={item} className={s.gridItem}>
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
    </Space>
  )
}

export default Dashboard
