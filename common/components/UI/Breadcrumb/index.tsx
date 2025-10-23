'use client'

import { HomeOutlined } from '@ant-design/icons'
import {
  Breadcrumb as AntdBreadcrumb,
  BreadcrumbProps as AntdBreadcrumbProps,
  Button,
} from 'antd'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useScrollToTop } from '@modules/hooks/useScrollToTop'
import styles from './style.module.scss'

export type BreadcrumbPath = {
  title: React.ReactNode
  path?: string
}

export interface BreadcrumbProps extends Omit<AntdBreadcrumbProps, 'items'> {
  path?: BreadcrumbPath[]
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, ...props }) => {
  const router = useRouter()
  const { handleNavigateHome } = useScrollToTop()

  const paths: any[] = useMemo(() => {
    return (
      path?.map((item) => ({
        title: item.title,
        ...(!!item.path && { onClick: () => router.push(item.path) }),
      })) ?? []
    )
  }, [router, path])

  return (
    <AntdBreadcrumb
      className={styles.Breadcrumb}
      items={[{ title: <HomeOutlined />, onClick: handleNavigateHome }, ...paths]}
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
