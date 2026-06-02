import { useEffect } from 'react'
import { Button, notification } from 'antd'
import useServiceWorkerUpdate from '@modules/hooks/useServiceWorkerUpdate'

const NOTIFICATION_KEY = 'service-worker-update'

const ServiceWorkerUpdateNotifier: React.FC = () => {
  const hasUpdate = useServiceWorkerUpdate()
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    if (!hasUpdate) return

    api.open({
      key: NOTIFICATION_KEY,
      message: 'Доступна нова версія',
      description: 'Щоб побачити останні зміни, перезавантажте сторінку.',
      placement: 'topRight',
      duration: 0,
      btn: (
        <Button
          type="primary"
          size="small"
          onClick={() => window.location.reload()}
        >
          Оновити
        </Button>
      ),
    })
  }, [hasUpdate, api])

  return contextHolder
}

export default ServiceWorkerUpdateNotifier
