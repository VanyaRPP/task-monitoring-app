import { useEffect, useState } from 'react'
import { Tour, TourProps } from 'antd'
import { useSession } from 'next-auth/react'

interface InvoiceTourProps {
  // Increment to manually (re)start the tour, e.g. from a "?" button.
  startSignal?: number
  onClose?: () => void
}

type CustomTourStep = TourProps['steps'][0] & {
  nextButtonProps?: { children: string }
  prevButtonProps?: { children: string }
}

// Highlights each field of the create-invoice form so a new user understands
// what every input is for and how to add a service. Mirrors the DashboardTour
// pattern (AntD Tour + per-user localStorage gate + querySelector targeting).
const InvoiceTour: React.FC<InvoiceTourProps> = ({
  startSignal = 0,
  onClose,
}) => {
  const { data: session } = useSession()
  const [tourVisible, setTourVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const storageKey = `invoiceTourSeen_${session?.user?.email}`

  useEffect(() => {
    if (!session?.user?.email) return
    const hasSeenTour = localStorage.getItem(storageKey)
    if (!hasSeenTour) {
      // Let the modal finish mounting so the targets exist.
      const timer = setTimeout(() => {
        setTourVisible(true)
        localStorage.setItem(storageKey, 'true')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [session?.user?.email, storageKey])

  useEffect(() => {
    if (startSignal > 0) {
      setTourVisible(true)
      setCurrentStep(0)
    }
  }, [startSignal])

  const handleClose = () => {
    setTourVisible(false)
    onClose?.()
  }

  const getEl = (key: string): HTMLElement =>
    (document.querySelector(`[data-invoice-tour="${key}"]`) as HTMLElement) ||
    document.body

  const steps: CustomTourStep[] = [
    {
      title: 'Надавач послуг',
      description:
        'Хто виставляє рахунок — ваша організація/ОСББ. Оберіть наявного або створіть нового прямо тут.',
      target: () => getEl('domain'),
    },
    {
      title: 'Компанія (отримувач)',
      description:
        'Кому виставляється рахунок. Для нової компанії впишіть назву і пошту — на неї піде рахунок.',
      target: () => getEl('company'),
    },
    {
      title: 'Місяць',
      description:
        'Розрахунковий період рахунку. Від нього залежать тарифи, за якими підставляються послуги.',
      target: () => getEl('month'),
    },
    {
      title: 'Послуги та сума',
      description:
        'Додайте послуги: оберіть з каталогу або «Власне», вкажіть назву, кількість і ціну — сума порахується автоматично (ціна × кількість).',
      target: () => getEl('amount'),
    },
    {
      title: 'Адреса, номер, дата, валюта',
      description:
        'Заповнюються самі: адреса — з компанії, номер — наступний вільний, дата — сьогодні. Розгорніть блок, якщо треба щось змінити.',
      target: () => getEl('details'),
    },
    {
      title: 'Готово',
      description:
        '«Додати» зберігає рахунок як чернетку. «Додати й надіслати» — зберігає й одразу відправляє його компанії на пошту.',
      target: () =>
        (document.querySelector('.ant-modal-footer') as HTMLElement) ||
        getEl('amount'),
    },
  ].map((step, index, arr) => ({
    ...step,
    nextButtonProps: {
      children: index === arr.length - 1 ? 'Зрозуміло' : 'Далі',
    },
    prevButtonProps: { children: 'Назад' },
  }))

  if (!tourVisible) {
    return null
  }

  return (
    <Tour
      open={tourVisible}
      onClose={handleClose}
      onFinish={handleClose}
      steps={steps}
      current={currentStep}
      onChange={setCurrentStep}
      zIndex={1100}
      mask={{ color: 'rgba(0, 0, 0, 0.45)' }}
      type="primary"
    />
  )
}

export default InvoiceTour
