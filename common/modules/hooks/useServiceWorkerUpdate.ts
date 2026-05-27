import { useEffect, useRef, useState } from 'react'

/**
 * Returns true once the active Service Worker has been swapped for a newer
 * one. Used to surface an in-app "reload to see the new version" prompt so
 * the user picks the moment to reload instead of losing their state to an
 * automatic refresh.
 */
function useServiceWorkerUpdate(): boolean {
  const [hasUpdate, setHasUpdate] = useState(false)
  const initialControllerRef = useRef<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    initialControllerRef.current = navigator.serviceWorker.controller

    const onControllerChange = () => {
      // Skip the very first activation on fresh visits — there was no
      // previous version, so there's nothing to "update from".
      if (initialControllerRef.current) {
        setHasUpdate(true)
      }
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange
    )

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      )
    }
  }, [])

  return hasUpdate
}

export default useServiceWorkerUpdate
