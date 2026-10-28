import { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'

const CHUNK_RELOAD_KEY = 'chunk-error-reloaded'

// After a deploy, cached pages may request JS chunks that no longer exist.
const isChunkLoadError = (error: Error) =>
  error?.name === 'ChunkLoadError' ||
  /Loading (CSS )?chunk [\w-]+ failed/i.test(error?.message ?? '')

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught an error', error, info)

    if (isChunkLoadError(error)) {
      try {
        // Reload once to fetch the fresh build; avoid an infinite reload loop.
        if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
          window.location.reload()
        }
      } catch {
        // sessionStorage may be unavailable
      }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Result
        status="warning"
        title="Щось пішло не так"
        subTitle="Сталася помилка під час завантаження сторінки. Спробуйте оновити її."
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Оновити сторінку
          </Button>
        }
      />
    )
  }
}

export default AppErrorBoundary
