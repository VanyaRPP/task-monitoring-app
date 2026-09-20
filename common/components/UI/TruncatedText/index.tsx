import { Tooltip } from 'antd'
import { TooltipPlacement } from 'antd/lib/tooltip'
import classNames from 'classnames'
import { useIsTruncated } from '@common/hooks/useIsTruncated'
import styles from './style.module.scss'

interface TruncatedTextProps {
  text: React.ReactNode
  as?: 'span' | 'p' | 'div'
  maxWidth?: number | string
  className?: string
  style?: React.CSSProperties
  tooltipPlacement?: TooltipPlacement
}

/**
 * Renders `text` cut off with an ellipsis once it no longer fits its box,
 * and exposes the full value via a Tooltip only when it's actually truncated.
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  as: Tag = 'span',
  maxWidth = '100%',
  className,
  style,
  tooltipPlacement,
}) => {
  const [ref, isTruncated] = useIsTruncated<HTMLElement>([text])

  const content = (
    <Tag
      ref={ref as any}
      className={classNames(styles.TruncatedText, className)}
      style={{ maxWidth, ...style }}
    >
      {text}
    </Tag>
  )

  return isTruncated ? (
    <Tooltip title={text} placement={tooltipPlacement}>
      {content}
    </Tooltip>
  ) : (
    content
  )
}
