import {
  DollarOutlined,
  LineChartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import useKeyCode from '@modules/hooks/useKeyCode'
import { AppRoutes, Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { RootState } from '@modules/store/store'
import { Menu as AntdMenu, MenuProps as AntdMenuProps } from 'antd'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

export type MenuProps = Omit<AntdMenuProps, 'selectedKeys' | 'mode' | 'items'>

export const Menu: React.FC<MenuProps> = ({ defaultOpenKeys, ...props }) => {
  const [isDevMode, setIsDevMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()

  const [userOpenKeys, setUserOpenKeys] = useState<string[]>(
    (defaultOpenKeys as string[]) ?? []
  )
  const forcedOpenKeys = useSelector(
    (state: RootState) => state.sidebar.forcedOpenKeys
  )
  const openKeys = forcedOpenKeys.length
    ? Array.from(new Set([...userOpenKeys, ...forcedOpenKeys]))
    : userOpenKeys

  const handleSequenceDetected = () => {
    setIsDevMode(!isDevMode)
  }

  useKeyCode('hellodev', handleSequenceDetected, 2000)

  const roles = useMemo<string[]>(() => {
    const r = (user as any)?.roles ?? (user as any)?.role
    return Array.isArray(r) ? r : r ? [r] : []
  }, [user])

  const isDomainAdmin = useMemo(
    () => roles.includes(Roles.DOMAIN_ADMIN),
    [roles]
  )

  const isGlobalAdmin = useMemo(
    () => roles.includes(Roles.GLOBAL_ADMIN),
    [roles]
  )

  const items = useMemo<AntdMenuProps['items']>(() => {
    return [
      {
        key: 'payments_submenu',
        type: 'submenu',
        label: 'Платежі',
        icon: <DollarOutlined />,
        children: [
          {
            key: AppRoutes.PAYMENT,
            type: 'item',
            label: (
              <Link href={AppRoutes.PAYMENT}>
                {isGlobalAdmin || isDomainAdmin ? 'Платежі' : 'Мої платежі'}
              </Link>
            ),
          },
          {
            key: AppRoutes.PAYMENT_BULK,
            type: 'item',
            label: (
              <Link href={AppRoutes.PAYMENT_BULK}>Створення рахунків</Link>
            ),
            hidden: !isGlobalAdmin && !isDomainAdmin,
          },
          {
            key: AppRoutes.PAYMENT_CHART,
            type: 'item',
            label: <Link href={AppRoutes.PAYMENT_CHART}>Графік платежів</Link>,
          },
          {
            key: 'bank',
            type: 'item',
            label: <Link href={AppRoutes.BANK}>Банк</Link>,
            hidden: !isAdminCheck(roles),
          },
          {
            key: AppRoutes.PROFIT,
            type: 'item',
            label: <Link href={AppRoutes.PROFIT}>Прибутки</Link>,
            hidden: !isAdminCheck(roles),
          },
        ].filter(({ hidden }) => !hidden),
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
            label: <Link href={AppRoutes.INDEX}>Головна сторінка</Link>,
          },
          {
            key: AppRoutes.TABLES,
            type: 'item',
            label: <Link href={AppRoutes.TABLES}>Всі таблиці</Link>,
          },
          {
            key: AppRoutes.STREETS,
            type: 'item',
            label: <Link href={AppRoutes.STREETS}>Вулиці</Link>,
            hidden: !isGlobalAdmin && !isDomainAdmin,
          },
          {
            key: AppRoutes.DOMAIN,
            type: 'item',
            label: <Link href={AppRoutes.DOMAIN}>Надавачі послуг</Link>,
          },
          {
            key: AppRoutes.REAL_ESTATE,
            type: 'item',
            label: <Link href={AppRoutes.REAL_ESTATE}>Компанії</Link>,
          },
          {
            key: AppRoutes.SERVICE,
            type: 'item',
            label: <Link href={AppRoutes.SERVICE}>Послуги</Link>,
          },
        ].filter(({ hidden }) => !hidden),
      },
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
            label: <Link href={AppRoutes.PROFILE}>Профіль</Link>,
          },
          {
            key: AppRoutes.ADMIN_PANEL,
            type: 'item',
            label: <Link href={AppRoutes.ADMIN_PANEL}>Адмін панель</Link>,
            hidden: !isGlobalAdmin && !isDomainAdmin,
          },
        ].filter(({ hidden }) => !hidden),
      },
    ] as AntdMenuProps['items']
  }, [isGlobalAdmin, isDomainAdmin, user?.roles, session?.user?.name])

  return (
    <AntdMenu
      selectedKeys={pathname ? [pathname] : []}
      mode="inline"
      items={items}
      openKeys={openKeys}
      onOpenChange={(keys) => setUserOpenKeys(keys as string[])}
      {...props}
      style={{ paddingBottom: '50px' }}
    />
  )
}
