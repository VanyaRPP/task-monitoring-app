import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react'
import DomainsBlock from '@components/DashboardPage/blocks/domains'
import PaymentsBlock from '@components/DashboardPage/blocks/payments'
import RealEstateBlock from '@components/DashboardPage/blocks/realEstates'
import ServicesBlock from '@components/DashboardPage/blocks/services'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import CompaniesAreaChart from '@components/DashboardPage/blocks/сompaniesAreaChart'
import { Roles } from '@utils/constants'
import { Col, Row, Space, Button, Flex, message, Tooltip, Dropdown } from 'antd'
import {
  CloseOutlined,
  SaveOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import PaymentsChart from '@components/DashboardPage/blocks/paymentChart'
import ProfitPage from '@components/Pages/ProfiitPage'
import { addButton, removeButton } from '@modules/store/floatButtonSlice'
import {
  useEditModelFloatButton,
  useDragDropPanelFloatButton,
} from '@modules/hooks/useFloatButton'
import { useDispatch } from 'react-redux'
import s from './style.module.scss'
import useTheme from '@modules/hooks/useTheme'
import WidgetVisibilityMenu from '@components/UI/WidgetVisibilityMenu'
import { WidgetWrapper } from '@components/UI/WidgetWrapper'
import DashboardTour from '@components/DashboardPage/DashboardTour'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const MARGIN_Y = 12
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
export type WidgetKey = (typeof ALL_WIDGETS)[number]
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

interface SortableWidgetProps {
  id: WidgetKey
  isEditMode: boolean
  children: React.ReactNode
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
  id,
  isEditMode,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: MARGIN_Y,
    cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
    userSelect: 'none',
    touchAction: 'none',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      id={id}
      className={isEditMode ? s.gridItem : ''}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      {children}
    </div>
  )
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch()
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  const [showTour, setShowTour] = useState(false)

  const [isEditMode, toggleEditMode, editFloatButton] =
    useEditModelFloatButton('dashboard')
  const [isPanelVisible, togglePanelVisible, panelFloatButton] =
    useDragDropPanelFloatButton('dashboard')

  const [theme] = useTheme()
  const isDark = theme === 'dark'

  const [hiddenWidget, setHiddenWidget] = useState<WidgetKey[]>([])
  const menu = (
    <div style={{ padding: 8 }}>
      <WidgetVisibilityMenu
        hidden={hiddenWidget}
        onChange={setHiddenWidget}
        available={[...ALL_WIDGETS]}
        labels={widgetLabels}
      />
    </div>
  )

  useEffect(() => {
    if (isPanelVisible && !isEditMode) {
      toggleEditMode()
    } else if (!isPanelVisible && isEditMode) {
      toggleEditMode()
    }
  }, [isPanelVisible, isEditMode, toggleEditMode])
  const tourFloatButton = useMemo(
    () => ({
      key: 'dashboard-tour',
      icon: <QuestionCircleOutlined />,
      onClick: () => setShowTour(true),
      tooltip: 'Тур',
      order: 5,
    }),
    []
  )

  useEffect(() => {
    dispatch(addButton(panelFloatButton))
    dispatch(addButton(tourFloatButton))
    return () => {
      dispatch(removeButton(panelFloatButton.key))
      dispatch(removeButton(tourFloatButton.key))
    }
  }, [dispatch, panelFloatButton, tourFloatButton])

  const getLayoutStorageKey = (userId?: string) =>
    userId ? `dashboard-layout-${userId}` : 'dashboard-layout'
  const visibleWidgets = useMemo<WidgetKey[]>(() => {
    if (isGlobalAdmin === undefined) return [...ALL_WIDGETS]
    return isGlobalAdmin
      ? [...ALL_WIDGETS]
      : ALL_WIDGETS.filter((w) => w !== 'profits')
  }, [isGlobalAdmin])

  const [orderedWidgets, setOrderedWidgets] =
    useState<WidgetKey[]>(visibleWidgets)
  const [isLayoutReady, setIsLayoutReady] = useState(false)

  useEffect(() => {
    const userId = userResponse?._id?.toString()
    if (!userId) return

    const saved = localStorage.getItem(getLayoutStorageKey(userId))
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const savedOrder: WidgetKey[] = parsed.layout ?? []
        const merged = [
          ...savedOrder.filter((w) => visibleWidgets.includes(w)),
          ...visibleWidgets.filter((w) => !savedOrder.includes(w)),
        ]
        setOrderedWidgets(merged)
        setHiddenWidget(parsed.hidden ?? [])
      } catch {}
    } else {
      setOrderedWidgets(visibleWidgets)
    }
    setIsLayoutReady(true)
  }, [userResponse?._id])

  const renderedWidgets = useMemo(
    () => orderedWidgets.filter((w) => !hiddenWidget.includes(w)),
    [orderedWidgets, hiddenWidget]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const [isDraggingActive, setIsDraggingActive] = useState(false)

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setIsDraggingActive(true)
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDraggingActive(false)
    document.body.style.cursor = ''

    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrderedWidgets((prev) => {
      const oldIndex = prev.indexOf(active.id as WidgetKey)
      const newIndex = prev.indexOf(over.id as WidgetKey)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleDragCancel = useCallback(() => {
    setIsDraggingActive(false)
    document.body.style.cursor = ''
  }, [])

  const handleSave = useCallback(() => {
    const userId = userResponse?._id?.toString()
    if (!userId) return
    localStorage.setItem(
      getLayoutStorageKey(userId),
      JSON.stringify({ layout: orderedWidgets, hidden: hiddenWidget })
    )
    message.success('Збережено!')
    togglePanelVisible()
  }, [userResponse?._id, orderedWidgets, hiddenWidget, togglePanelVisible])

  return (
    <div className={s.wrapper}>
      {isPanelVisible && (
        <div className={`${s.toolbar} ${isDark ? s.dark : s.light}`}>
          <div className={s.buttonsBlock}>
            {orderedWidgets.map((key) => (
              <Button
                key={key}
                type="link"
                onClick={() => {
                  const element = document.getElementById(key)
                  if (element) {
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                  }
                }}
              >
                {widgetLabels[key]}
              </Button>
            ))}
          </div>
          <div className={s.actions}>
            <div
              className={s.divider}
              style={{ backgroundColor: isDark ? '#555' : '#ccc' }}
            />
            <Dropdown overlay={menu} trigger={['click']}>
              <Tooltip title="Приховати віджети">
                <Button icon={<EyeOutlined />} />
              </Tooltip>
            </Dropdown>

            <Tooltip title="Зберегти">
              <Button icon={<SaveOutlined />} onClick={handleSave} />
            </Tooltip>
            <Tooltip title="Вийти з режиму редагування">
              <Button icon={<CloseOutlined />} onClick={togglePanelVisible} />
            </Tooltip>
          </div>
        </div>
      )}
      {isLayoutReady && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={renderedWidgets}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="dashboard-grid"
              style={{ maxWidth: '100%', overflow: 'hidden' }}
            >
              {renderedWidgets.map((key) => (
                <SortableWidget key={key} id={key} isEditMode={isEditMode}>
                  <WidgetWrapper
                    id={key}
                    rowHeight={1.3}
                    marginY={MARGIN_Y}
                    isEditMode={isEditMode}
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    onHeightChange={() => {}}
                  >
                    <div className={s.filterWrapper}>{widgetMap[key]}</div>
                  </WidgetWrapper>
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <DashboardTour userRoles={userResponse?.roles || []} />
      <DashboardTour
        isVisible={showTour}
        onClose={() => setShowTour(false)}
        isManualStart={true}
        userRoles={userResponse?.roles || []}
      />
    </div>
  )
}

export default Dashboard
