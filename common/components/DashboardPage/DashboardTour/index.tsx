import { useEffect, useState, useCallback, useRef } from 'react'
import { Tour, TourProps } from 'antd'
import { useSession } from 'next-auth/react'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { RootState } from '@modules/store/store'
import {
  clearForcedOpenKeys,
  setCollapse,
  setForcedOpenKeys,
} from '@modules/store/sidebarSlice'
import { useDispatch, useSelector } from 'react-redux'

const TOUR_SUBMENU_KEYS = [
  'payments_submenu',
  'dashboard_submenu',
  'user_submenu',
]

interface DashboardTourProps {
  isVisible?: boolean
  onClose?: () => void
  isManualStart?: boolean
  userRoles?: string[]
}

type CustomTourStep = TourProps['steps'][0] & {
  nextButtonProps?: { children: string }
  prevButtonProps?: { children: string }
}

const DashboardTour: React.FC<DashboardTourProps> = ({
  isVisible = false,
  onClose,
  isManualStart = false,
  userRoles = [],
}) => {
  const { data: session } = useSession()
  const dispatch = useDispatch()
  const collapsed = useSelector((state: RootState) => state.sidebar.collapsed)
  const [tourVisible, setTourVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const startTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const storageKey = `dashboardTourSeen_${session?.user?.email}`

  useEffect(() => {
    if (!tourVisible) return
    return () => {
      dispatch(clearForcedOpenKeys())
    }
  }, [tourVisible, dispatch])

  const startTour = useCallback(() => {
    const allSubmenusOpen = TOUR_SUBMENU_KEYS.every((key) =>
      document
        .querySelector(`.ant-menu-submenu[data-menu-id*="${key}"]`)
        ?.classList.contains('ant-menu-submenu-open')
    )
    const needsDelay = collapsed || !allSubmenusOpen

    dispatch(setCollapse(false))
    dispatch(setForcedOpenKeys(TOUR_SUBMENU_KEYS))
    setCurrentStep(0)

    clearTimeout(startTimerRef.current)
    if (needsDelay) {
      startTimerRef.current = setTimeout(() => setTourVisible(true), 100)
    } else {
      setTourVisible(true)
    }
  }, [collapsed, dispatch])

  useEffect(() => () => clearTimeout(startTimerRef.current), [])

  useEffect(() => {
    if (isManualStart) return
    if (!session?.user?.email) return
    if (!storageKey) return
    const hasSeenTour = localStorage.getItem(storageKey)

    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        startTour()
        localStorage.setItem(storageKey, 'true')
      }, 1200)

      return () => clearTimeout(timer)
    }
  }, [session?.user?.email, isManualStart, storageKey, startTour])

  useEffect(() => {
    if (isManualStart && isVisible) {
      startTour()
    }
  }, [isManualStart, isVisible, startTour])

  const handleClose = () => {
    setTourVisible(false)
    onClose?.()
  }

  const handleTourChange = (step: number) => {
    setCurrentStep(step)
  }

  const getMenuElement = (menuItemKey: string) => {
    const selector = `.ant-menu-item[data-menu-id*="${menuItemKey}"], .ant-menu-submenu[data-menu-id*="${menuItemKey}"]`
    let element = document.querySelector(selector)

    if (!element) {
      const allMenuItems = document.querySelectorAll(
        '.ant-menu-item, .ant-menu-submenu'
      )
      element = Array.from(allMenuItems).find(
        (item) =>
          item.textContent?.includes(menuItemKey) ||
          item.querySelector(`a[href*="${menuItemKey}"]`)
      ) as HTMLElement
    }

    return element ? (element as HTMLElement) : document.body
  }

  const getMenuItemByRoute = (route: string, text: string) => {
    const linkSelector = `a[href*="${route}"]`
    const linkElement = document.querySelector(linkSelector)

    if (linkElement) {
      const menuItem = linkElement.closest('.ant-menu-item')
      return menuItem ? (menuItem as HTMLElement) : null
    }

    const allMenuItems = document.querySelectorAll('.ant-menu-item')
    const foundItem = Array.from(allMenuItems).find((item) =>
      item.textContent?.includes(text)
    )

    return foundItem ? (foundItem as HTMLElement) : null
  }

  const getUserAvatarElement = () => {
    return (
      (document.querySelector('.ant-avatar') as HTMLElement) || document.body
    )
  }

  const isAdmin = isAdminCheck(userRoles)
  const getTourSteps = (): CustomTourStep[] => {
    const steps: CustomTourStep[] = [
      {
        title: 'Платежі',
        description:
          'Сторінка для виставлення рахунку компанії за послуги в місяць',
        target: () =>
          getMenuItemByRoute(AppRoutes.PAYMENT, 'Платежі') ||
          getMenuElement('payments_submenu'),
        placement: 'right',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      },
      {
        title: 'Компанії',
        description:
          'Сторінка компаній, для перегляду інформації про компанію користувача',
        target: () =>
          getMenuItemByRoute(AppRoutes.REAL_ESTATE, 'Компанії') ||
          getMenuElement('real_estate'),
        placement: 'right',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      },
      {
        title: 'Надавачі послуг',
        description:
          'Сторінка для перегляду інформації про домен який надає ряд особистих послуг',
        target: () =>
          getMenuItemByRoute(AppRoutes.DOMAIN, 'Надавачі послуг') ||
          getMenuElement('domain'),
        placement: 'right',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      },
      {
        title: 'Послуги',
        description: 'Сторінка для виставлення цін за послуги в місяць',
        target: () =>
          getMenuItemByRoute(AppRoutes.SERVICE, 'Послуги') ||
          getMenuElement('service'),
        placement: 'right',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      },
      {
        title: 'Профіль',
        description: 'Перегляд особистої інформації про себе.',
        target: () =>
          getMenuItemByRoute(AppRoutes.PROFILE, 'Профіль') ||
          getMenuElement('profile'),
        placement: 'right',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      },
      {
        title: 'Профіль',
        description: 'Також можна перейти в профіль.',
        target: () => getUserAvatarElement(),
        placement: 'bottomLeft',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      },
    ]
    if (isAdmin) {
      steps.push({
        title: 'Банк',
        description:
          'Сторінка для перегляду вхідних платежів до особистого рахунку у банку',
        target: () =>
          getMenuItemByRoute(AppRoutes.BANK, 'Банк') || getMenuElement('bank'),
        placement: 'right',
        nextButtonProps: { children: 'Далі' },
        prevButtonProps: { children: 'Назад' },
      })

      steps.push({
        title: 'Прибутки',
        description:
          'Сторінка для перегляду та контролю втрат/прибутків за місяць',
        target: () =>
          getMenuItemByRoute(AppRoutes.PROFIT, 'Прибутки') ||
          getMenuElement('profit'),
        placement: 'right',
        nextButtonProps: { children: 'Фініш' },
        prevButtonProps: { children: 'Назад' },
      })
    }

    return steps
  }

  if (!tourVisible) {
    return null
  }

  return (
    <Tour
      open={tourVisible}
      onClose={handleClose}
      steps={getTourSteps()}
      current={currentStep}
      onChange={handleTourChange}
      onFinish={handleClose}
      mask={{
        color: 'rgba(0, 0, 0, 0.5)',
      }}
      type="primary"
    />
  )
}

export default DashboardTour
