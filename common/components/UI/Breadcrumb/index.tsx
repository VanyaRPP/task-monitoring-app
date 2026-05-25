'use client'

import { HomeOutlined } from '@ant-design/icons'
import { useScrollToTop } from '@modules/hooks/useScrollToTop'
import {
  Breadcrumb as AntdBreadcrumb,
  BreadcrumbProps as AntdBreadcrumbProps,
  Button,
} from 'antd'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import styles from './style.module.scss'

export type BreadcrumbPath = {
  title: React.ReactNode
  path?: string
}

export interface BreadcrumbProps extends Omit<AntdBreadcrumbProps, 'items'> {
  path?: BreadcrumbPath[]
  onPathClick?: (path: string) => void
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  path,
  onPathClick,
  ...props
}) => {
  const router = useRouter()
  const { handleNavigateHome } = useScrollToTop()

  const normalizedPath = useMemo(() => {
    if (!path?.length) return []
    const firstTitle =
      typeof path[0]?.title === 'string' ? path[0].title.trim() : ''
    return firstTitle === 'Панель управління' ? path.slice(1) : path
  }, [path])

  const paths = useMemo(() => {
    return (
      normalizedPath.map((item) => {
        const path = item.path
        return {
        title: item.title,
        ...(item.path && {
          onClick: () => {
            if (onPathClick) onPathClick(item.path!)
            else router.push(item.path!)
          },
        }),
      }
      }) ?? []
    )
  }, [router, normalizedPath, onPathClick])

  const showCrumbs = paths.length > 0

  return (
    <AntdBreadcrumb
      className={styles.Breadcrumb}
      items={[
        { title: <HomeOutlined />, onClick: handleNavigateHome },
        ...(showCrumbs ? paths : []),
      ]}
      itemRender={(item) =>
        item.onClick ? (
          <Button
            type="text"
            onClick={item.onClick}
            style={{ paddingInline: 4, marginInline: -4 }}
          >
            {item.title}
          </Button>
        ) : (
          item.title
        )
      }
      {...props}
    />
  )
}
