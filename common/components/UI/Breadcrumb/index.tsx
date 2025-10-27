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

  const paths: any[] = useMemo(() => {
    return (
      path?.map((item) => ({
        title: item.title,
        ...(!!item.path && {
          onClick: () => {
            if (onPathClick) {
              onPathClick(item.path)
            } else {
              router.push(item.path)
            }
          },
        }),
      })) ?? []
    )
  }, [router, path, onPathClick])

  return (
    <AntdBreadcrumb
      className={styles.Breadcrumb}
      items={[
        { title: <HomeOutlined />, onClick: handleNavigateHome },
        ...paths,
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
