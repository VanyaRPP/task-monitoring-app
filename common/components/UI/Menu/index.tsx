import {
  DollarOutlined,
  LineChartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { Menu as AntdMenu, MenuProps as AntdMenuProps } from 'antd'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export type MenuProps = Omit<AntdMenuProps, 'selectedKeys' | 'mode' | 'items'>

export const Menu: React.FC<MenuProps> = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()

  const isDomainAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.DOMAIN_ADMIN)
  }, [user])
  const isGlobalAdmin = useMemo(() => {
    return user?.roles?.includes(Roles.GLOBAL_ADMIN)
  }, [user])

  const items = useMemo<AntdMenuProps['items']>(() => {
    return [
      {
        key: 'user_submenu',
        type: 'submenu',
        label: session?.user?.name || 'Мої',
        icon: <UserOutlined />,
        children: [
          // TODO: dashboard page with customizible layout
          // {
          //   key: AppRoutes.DASHBOARD,
          //   type: 'item',
          //   label: 'Панель',
          //   onClick: () => router.push(AppRoutes.DASHBOARD),
          // },
          {
            key: AppRoutes.PROFILE,
            type: 'item',
            label: 'Профіль',
            onClick: () => router.push(AppRoutes.PROFILE),
          },
        ],
      },
      {
        key: 'dashboard_submenu',
        type: 'submenu',
        label: 'Панель управління',
        icon: <LineChartOutlined />,
        children: [
          {
            key: AppRoutes.INDEX,
            type: 'item',
            label: 'Головна',
            onClick: () => router.push(AppRoutes.INDEX),
          },
          {
            key: AppRoutes.STREETS,
            type: 'item',
            label: 'Вулиці',
            onClick: () => router.push(AppRoutes.STREETS),
          },
          {
            key: AppRoutes.DOMAIN,
            type: 'item',
            label: 'Надавачі послуг',
            onClick: () => router.push(AppRoutes.DOMAIN),
          },
          {
            key: AppRoutes.REAL_ESTATE,
            type: 'item',
            label: 'Компанії',
            onClick: () => router.push(AppRoutes.REAL_ESTATE),
          },
          {
            key: AppRoutes.SERVICE,
            type: 'item',
            label: 'Послуги',
            onClick: () => router.push(AppRoutes.SERVICE),
          },
        ],
      },
      {
        key: 'payments_submenu',
        type: 'submenu',
        label: 'Платежі',
        icon: <DollarOutlined />,
        children: [
          {
            key: AppRoutes.PAYMENT,
            type: 'item',
            label: isGlobalAdmin || isDomainAdmin ? 'Платежі' : 'Мої платежі',
            onClick: () => router.push(AppRoutes.PAYMENT),
          },
          {
            key: AppRoutes.PAYMENT_BULK,
            type: 'item',
            label: 'Bulk',
            onClick: () => router.push(AppRoutes.PAYMENT_BULK),
            hidden: true,
          },
          {
            key: AppRoutes.PAYMENT_CHART,
            type: 'item',
            label: 'Графік платежів',
            onClick: () => router.push(AppRoutes.PAYMENT_CHART),
          },
        ].filter(({ hidden }) => !hidden),
      },
    ] as AntdMenuProps['items']
  }, [router, session, isGlobalAdmin, isDomainAdmin])

  return (
    <AntdMenu
      selectedKeys={pathname ? [pathname] : []}
      mode="inline"
      items={items}
      {...props}
    />
  )
}
