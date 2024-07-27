import { Spin } from 'antd'

export interface LoadingProps {
  loading?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const Loading: React.FC<LoadingProps> = ({
  loading = false,
  children,
  ...props
}) => {
  return loading ? <Spin {...props} /> : <>{children}</>
}
